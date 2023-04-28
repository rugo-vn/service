import process from 'node:process';
import { clone, mergeDeepLeft } from 'ramda';
import { INTERNAL_ACTIONS } from '../constants.js';
import { createSocket } from '../socket.js';

let actionMapping = null;
let socket;

async function setupProcess() {
  const socketPath = process.argv[process.argv.length - 1];
  socket = await createSocket(socketPath);

  socket.on('data', async (action, args = {}, opts = {}) => {
    if (!actionMapping[action]) return null;

    return await actionMapping[action].bind({
      call(nextAddr, nextArgs = {}, nextOpts = {}) {
        return callAction(nextAddr, nextArgs, mergeDeepLeft(nextOpts, opts));
      },
    })(args, clone(opts));
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
