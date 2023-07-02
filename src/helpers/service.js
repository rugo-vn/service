import process from 'node:process';
import { clone, isNil, mergeDeepLeft } from 'ramda';
import { INTERNAL_ACTIONS } from '../constants.js';
import { createSocket } from '../socket.js';
import { pack, unpack } from '../wrap.js';

let actionMapping = null;
let socket;

async function wrapExcept(fn, args, opts) {
  const exceptAction = actionMapping['except'];

  if (!exceptAction) return await fn.bind(this)(args, opts);

  try {
    return await fn.bind(this)(args, opts);
  } catch (err) {
    return await exceptAction.bind(this)(err, args, opts);
  }
}

async function setupProcess() {
  const socketPath = process.argv[process.argv.length - 1];
  socket = await createSocket(socketPath);

  socket.on('data', async (action, args = {}, opts = {}) => {
    return actionMapping[action]
      ? await pack(() =>
          wrapExcept.bind({
            call(nextAddr, nextArgs = {}, nextOpts = {}) {
              return callAction(
                nextAddr,
                nextArgs,
                mergeDeepLeft(nextOpts, opts)
              );
            },
          })(actionMapping[action], args, clone(opts))
        )
      : await pack();
  });

  actionMapping['ls'] = () =>
    Object.keys(actionMapping).filter(
      (name) => INTERNAL_ACTIONS.indexOf(name) === -1
    );
}

export function defineAction(action, fn) {
  if (!actionMapping) {
    setupProcess();
    actionMapping = {};
  }

  if (!action || !fn) return;

  actionMapping[action] = fn;
}

export async function callAction(addr, args = {}, opts = {}) {
  if (actionMapping[addr]) {
    const res = await actionMapping[addr].bind({
      call(nextAddr, nextArgs = {}, nextOpts = {}) {
        return callAction(nextAddr, nextArgs, mergeDeepLeft(nextOpts, opts));
      },
    })(args, clone(opts));
    return res;
  }

  return unpack(await socket.send(addr, args, opts));
}
