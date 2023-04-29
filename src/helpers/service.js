import process from 'node:process';
import { add, clone, isNil, mergeDeepLeft } from 'ramda';
import { Exception } from '../classes.js';
import { INTERNAL_ACTIONS } from '../constants.js';
import { createSocket } from '../socket.js';

let actionMapping = null;
let socket;

async function setupProcess() {
  const socketPath = process.argv[process.argv.length - 1];
  socket = await createSocket(socketPath);

  socket.on('data', async (action, args = {}, opts = {}) => {
    let data = undefined;
    let isThrow = false;

    if (actionMapping[action])
      try {
        data = await actionMapping[action].bind({
          call(nextAddr, nextArgs = {}, nextOpts = {}) {
            return callAction(
              nextAddr,
              nextArgs,
              mergeDeepLeft(nextOpts, opts)
            );
          },
        })(args, clone(opts));
      } catch (err) {
        if (err.constructor.name === 'Error') {
          data = new Exception(err);
        } else {
          data = err;
        }
        isThrow = true;
      }

    return {
      type: isNil(data) ? 'Nil' : data.constructor.name,
      data,
      isThrow,
    };
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

export async function callAction(addr, args, opts) {
  return await socket.send(addr, args, opts);
}
