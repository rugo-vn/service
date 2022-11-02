import { resolve } from 'path';
import { flatten, curryN, clone, set, lensPath } from 'ramda';
import { RugoException, ServiceError } from './exception.js';
import { FileCursor } from './file.js';
import pino from 'pino';
import pretty from 'pino-pretty';
import colors from 'colors';

const BLACK_NAMES = ['name', 'settings', 'methods', 'actions', 'hooks', 'start', 'started', 'close', 'closed', 'call', 'all'];

const getHookFn = function (def, methods) {
  if (typeof def === 'function') { return [def]; }

  if (typeof def === 'string' && methods[def]) { return [methods[def]]; }

  if (Array.isArray(def)) { return flatten(def.map(df => getHookFn(df, methods))); }

  throw new ServiceError(`Hook method "${def}" is not found.`);
};

const wrapAction = function ({ methods = {}, hooks = {} } = {}, action, service) {
  const actionName = action.name;

  const instance = {
    type: 'local',
    action,
    service
  };

  // before
  let fns = [];
  if (hooks.before && hooks.before.all) { fns.push(getHookFn(hooks.before.all, methods)); }
  if (hooks.before && hooks.before[actionName]) { fns.push(getHookFn(hooks.before[actionName], methods)); }
  instance.before = flatten(fns);

  // after
  fns = [];
  if (hooks.after && hooks.after[actionName]) { fns.push(getHookFn(hooks.after[actionName], methods)); }
  if (hooks.after && hooks.after.all) { fns.push(getHookFn(hooks.after.all, methods)); }
  instance.after = flatten(fns);

  // error
  fns = [];
  if (hooks.error && hooks.error[actionName]) { fns.push(getHookFn(hooks.error[actionName], methods)); }
  if (hooks.error && hooks.error.all) { fns.push(getHookFn(hooks.error.all, methods)); }
  instance.error = flatten(fns);

  return instance;
};

const runHooks = async function (service, fns, ...args) {
  for (const fn of fns) {
    const fnRes = await fn.bind(service)(...args);
    if (fnRes !== undefined) { return fnRes; }
  }
  return undefined;
};

const serialize = function (data) {
  if (typeof data === 'string' || typeof data === 'number') { return data; }

  if (!data) { return data; }

  return JSON.parse(JSON.stringify(data));
};

const mapFileCursor = function (obj) {
  let results = [];
  const isArray = Array.isArray(obj);
  for (let key in obj) {
    if (isArray) { key = parseInt(key); }

    if (obj[key] instanceof FileCursor) {
      results.push({
        path: [key],
        value: obj[key]
      });

      delete obj[key];
      continue;
    }

    if (obj[key] && typeof obj[key] === 'object') {
      results = [
        ...results,
        ...mapFileCursor(obj[key]).map(i => ({ path: [key, ...i.path], value: i.value }))
      ];
    }
  }

  return results;
};

const callService = async function (brokerContext, address, args = {}) {
  if (!brokerContext[address]) { throw new ServiceError(`Invalid action address "${address}"`); }

  const instance = brokerContext[address];
  if (instance.type !== 'local') { throw new ServiceError(`Do not support action type "${instance.type}"`); }

  const { service, before: beforeFns, after: afterFns, error: errorFns, action } = instance;

  const nextArgs = clone(args);
  // const fileCursors = mapFileCursor(nextArgs);

  try {
    let res = await runHooks(service, beforeFns, nextArgs);
    if (res !== undefined) { return serialize(res); }

    res = await action.bind(service)(nextArgs);

    const newRes = await runHooks(service, afterFns, res, nextArgs);

    let returnRes = newRes || res;

    if (!returnRes) { return returnRes; }

    if (typeof returnRes !== 'object') { return returnRes; }

    if (returnRes instanceof FileCursor) { return returnRes; }

    const fileCursors = mapFileCursor(returnRes);
    returnRes = serialize(returnRes);

    for (const cursor of fileCursors) {
      returnRes = set(lensPath(cursor.path), cursor.value, returnRes);
    }

    return returnRes;
  } catch (err) {
    let newErr = err;

    try {
      // try hook to get value again
      const errRes = await runHooks(service, errorFns, err, nextArgs);
      if (!errRes) { // hook does not have any response
        throw err;
      } // continue error

      return serialize(errRes);
    } catch (e) { newErr = e; }

    if (!Array.isArray(newErr)) { newErr = [newErr]; }

    throw newErr.map((e) => e instanceof RugoException ? e : new RugoException(e.message));
  }
};

const createLogger = function (service) {
  return pino(pretty({
    colorize: true,
    ignore: 'pid,hostname',
    customPrettifiers: {
      name (name) {
        if (name[0] === '_') { // system service
          return colors.red(name.substring(1));
        }

        return name;
      }
    }
  })).child({
    name: service.name
  });
};

export const createService = function (context, serviceConfig) {
  // init
  context.addresses ||= {};
  context.globals ||= {};

  const brokerContext = context.addresses;

  // basic
  const service = {
    name: serviceConfig.name,
    settings: serviceConfig.settings || {}
  };

  Object.defineProperty(service, 'globals', {
    value: context.globals,
    writable: false
  });

  // add methods
  for (const name in serviceConfig.methods || {}) {
    const method = serviceConfig.methods[name];

    if (BLACK_NAMES.indexOf(name) !== -1) {
      throw new ServiceError(`Conflict method name "${name}"`);
    }

    service[name] = method.bind(service);
  }

  // add actions
  for (const name in serviceConfig.actions || {}) {
    const address = `${service.name}.${name}`;
    const action = serviceConfig.actions[name];

    if (address in brokerContext) {
      throw new ServiceError(`Conflict action name "${address}"`);
    }

    brokerContext[address] = wrapAction(serviceConfig, action, service);
  }

  // add funcs
  service.call = curryN(2, callService)(brokerContext);

  // add log
  service.logger = createLogger(service);

  // add start & close
  const proxyService = { ...service };
  proxyService.start = async () => await (serviceConfig.started || function () {}).bind(service)();
  proxyService.close = async () => await (serviceConfig.closed || function () {}).bind(service)();

  return proxyService;
};

export const loadServiceConfig = async function (serviceLocation) {
  return await import(resolve(serviceLocation));
};
