import process from 'node:process';
import { createSendData, parseReceivedData } from '../communicate.js';
import { COM_ACTIONS } from '../constants.js';

let actionMapping = null;

function reply(id, data) {
  console.log(createSendData(id, COM_ACTIONS.reply, { data }));
}

function setupProcess() {
  process.stdin.on('data', async (data) => {
    const res = parseReceivedData(data);
    if (!res) throw new Error(`Invalid data: ${data}`);
    const { id, action, payload } = res;

    if (action === COM_ACTIONS.start && !actionMapping[action]) {
      return reply(id, null);
    }

    if (action === COM_ACTIONS.stop && !actionMapping[action]) {
      return reply(id, null);
    }

    if (!actionMapping[action])
      throw new Error(`Action "${action}" is not defined.`);

    const nextData = await actionMapping[action](
      payload.args || {},
      payload.opts || {}
    );
    reply(id, nextData);
  });
}

export function defineAction(action, fn) {
  if (!actionMapping) {
    setupProcess();
    actionMapping = {};
  }

  if (!action || !fn) return;

  actionMapping[action] = fn;
}
