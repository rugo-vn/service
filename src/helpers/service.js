import process from 'node:process';
import { INTERNAL_ACTIONS } from '../constants.js';
import { createSocket } from '../socket.js';

let actionMapping = null;

async function setupProcess() {
  const socketPath = process.argv[process.argv.length - 1];
  const socket = await createSocket(socketPath);

  socket.on('data', async (action, args, opts) => {
    if (!actionMapping[action]) return null;

    return await actionMapping[action](args, opts);
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
