import { resolve } from 'path';
import { flatten, mergeDeepLeft, curryN } from 'ramda';

const BLACK_NAMES = ['name', 'settings', 'methods', 'actions', 'hooks', 'start', 'started', 'close', 'closed', 'call', 'all'];

function getHookFn (def, methods) {
  if (typeof def === 'function') { return [def]; }

  if (typeof def === 'string' && methods[def]) { return [methods[def]]; }

  if (Array.isArray(def)) { return flatten(def.map(df => getHookFn(df, methods))); }

  throw new Error(`Hook method "${def}" is not found.`);
}

const wrapAction = function({ methods = {}, hooks = {}} = {}, action, service) {
  const actionName = action.name;
  
  const instance = {
    type: 'local',
    action,
    service,
  };

  // before
  let fns = [];
  if (hooks.before && hooks.before.all)
    fns.push(getHookFn(hooks.before.all, methods));
  if (hooks.before && hooks.before[actionName])
    fns.push(getHookFn(hooks.before[actionName], methods));
  instance.before = flatten(fns);

  // after
  fns = [];
  if (hooks.after && hooks.after[actionName])
    fns.push(getHookFn(hooks.after[actionName], methods));
  if (hooks.after && hooks.after.all)
    fns.push(getHookFn(hooks.after.all, methods));
  instance.after = flatten(fns);

  return instance;
}

const runHooks = async function(service, fns, ...args) {
  for (const fn of fns) {
    let fnRes = await fn.bind(service)(...args);
    if (fnRes !== undefined) { return fnRes; }
  }
  return undefined;
}

function serialize (data) {
  if (typeof data === 'string' || typeof data === 'number') { return data; }

  if (!data) { return data; }

  return JSON.parse(JSON.stringify(data));
}

const callService = async function(brokerContext, prevShared, address, args = {}, shared = {}) {
  if (!brokerContext[address])
    throw new Error(`Invalid action address "${address}"`);

  const instance = brokerContext[address];
  if (instance.type !== 'local')
    throw new Error(`Do not support action type "${instance.type}"`);

  const { service, before: beforeFns, after: afterFns, action } = instance;

  const nextShared = mergeDeepLeft(shared, prevShared);
  const nextArgs = mergeDeepLeft(nextShared, args);
  const nextCall = curryN(3, callService)(brokerContext, nextShared);

  let res = await runHooks(service, beforeFns, nextArgs, nextCall);
  if (res !== undefined) { return serialize(res); }

  res = await action.bind(service)(nextArgs, nextCall);

  const newRes = await runHooks(service, afterFns, res, nextArgs, nextCall);

  return serialize(newRes || res);
}

export const createService = function(brokerContext, serviceConfig) {
  // basic
  const service = {
    name: serviceConfig.name,
    settings: serviceConfig.settings || {},
  };

  // add methods
  for (let name in serviceConfig.methods || {}) {
    let method = serviceConfig.methods[name];

    if (BLACK_NAMES.indexOf(name) !== -1) {
      throw new Error(`Conflict method name "${name}"`);
    }

    service[name] = method.bind(service);
  }

  // add actions
  for (let name in serviceConfig.actions || {}){
    let address = `${service.name}.${name}`;
    let action = serviceConfig.actions[name];

    if (address in brokerContext){
      throw new Error(`Conflict action name "${address}"`);
    }

    brokerContext[address] = wrapAction(serviceConfig, action, service);
  }

  // add call
  service.call = curryN(3, callService)(brokerContext, {});

  // add start & close
  const proxyService = {...service};
  proxyService.start = async () => await (serviceConfig.started || new Function()).bind(service)();
  proxyService.close = async () => await (serviceConfig.closed || new Function()).bind(service)();

  return proxyService;
}

export async function loadServiceConfig(serviceLocation) {
  return await import(resolve(serviceLocation));
}
