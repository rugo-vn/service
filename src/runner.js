import process from 'node:process';

import { clone, curry, curryN, flatten, mergeDeepLeft, path } from 'ramda';

import { parseEnv } from './env.js';
import { createLogger } from './logger.js';
import { addService, loadService } from './service.js';

/**
 *
 * @param context
 */
async function startService (context) {
  for (const service of context.services) {
    if (service.started) { await service.started.bind(service)(); }
  }
}

/**
 *
 * @param context
 */
async function stopService (context) {
  for (const service of context.services) {
    if (service.stopped) { await service.stopped.bind(service)(); }
  }
}

/**
 *
 * @param service
 * @param def
 */
function getHookFn (service, def) {
  if (typeof def === 'function') { return [def.bind(service)]; }

  if (typeof def === 'string' && service[def]) { return [service[def].bind(service)]; }

  if (Array.isArray(def)) { return flatten(def.map(df => getHookFn(service, df))); }

  throw new Error(`Hook '${def}' is not found.`);
}

/**
 *
 * @param fns
 * @param ctx
 * @param res
 */
async function chainHookExec (fns, ctx, res) {
  for (const fn of fns) {
    const fnRes = await fn(ctx, res);
    if (fnRes !== undefined) { return fnRes; }
  }

  return res;
}

/**
 *
 * @param type
 * @param service
 * @param action
 * @param ctx
 * @param res
 */
async function runHooks (type, service, action, ctx, res) {
  const hooks = path(['hooks', type], service) || {};

  const getFns = curry(getHookFn)(service);
  const fns = [];

  if (type === 'before' && hooks.all) {
    fns.push(getFns(hooks.all));
  }

  if (hooks[action]) {
    fns.push(getFns(hooks[action]));
  }

  if (type === 'after' && hooks.all) {
    fns.push(getFns(hooks.all));
  }

  const cRes = await chainHookExec(flatten(fns), ctx, res);
  if (cRes !== undefined) { return cRes; }

  return res;
}

/**
 *
 * @param data
 */
function serialize (data) {
  if (typeof data === 'string' || typeof data === 'number') { return data; }

  if (!data) { return data; }

  return JSON.parse(JSON.stringify(data));
}

/**
 *
 * @param context
 * @param address
 * @param params
 * @param opts
 */
async function callService (context, address, params = null, opts = {}) {
  for (const service of context.services) {
    if (address.indexOf(service.name + '.') !== 0) { continue; }

    const action = address.substring(service.name.length + 1);
    const meta = clone(opts.meta || {});

    if (!service.actions[action]) { continue; }

    const ctx = {
      params,
      locals: {},
      meta
    };

    let res = await runHooks('before', service, action, ctx);
    if (res !== undefined) { return serialize(res); }

    ctx.call = (address, params, opts) => callService(context, address, params, mergeDeepLeft(opts, { meta }));

    res = await service.actions[action].bind(service)(ctx);
    delete ctx.call;

    return serialize(await runHooks('after', service, action, ctx, res));
  }

  throw new Error(`Service '${address}' is not found.`);
}

/**
 *
 * @param env
 */
export function createRunner (env = process.env) {
  const context = {};

  context.settings = parseEnv(env);
  context.services = [{
    name: '$node',
    actions: {
      services () {
        return context.services.map((service) => ({ name: service.name }));
      },

      actions () {
        return flatten(context.services.map(service => {
          const res = [];
          for (const actionName in service.actions) { res.push({ name: `${service.name}.${actionName}` }); }

          return res;
        }));
      }
    }
  }];

  context.add = curry(addService)(context);
  context.load = () => loadService(context);

  context.start = () => startService(context);
  context.stop = () => stopService(context);

  context.call = curryN(2, callService)(context);
  context.logger = createLogger('runner');

  return context;
}
