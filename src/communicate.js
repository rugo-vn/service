import { COM_ACTIONS } from './constants.js';

export const createSendData = function (id, action, payload) {
  return JSON.stringify({ id, action, payload });
};

export const parseReceivedData = function (msg) {
  msg = msg.toString();

  let json;
  try {
    json = JSON.parse(msg);
  } catch (_) {
    return null;
  }

  if (!json.id || !json.action) return null;

  return json;
};

export function createChannel({
  invoke = () => {},
  handle = () => {},
  timeout = 1000,
  debug,
}) {
  const channel = {};
  const queue = {};
  let currentId = 0;

  const justSend = (action, payload, id) => {
    if (!id) id = ++currentId;
    const data = createSendData(id, action, payload);
    invoke(data);
    return id;
  };

  channel.parse = parseReceivedData;

  channel.receive = async function (msg) {
    const res = parseReceivedData(msg);

    if (!res) return;

    const { id, action, payload } = res;

    if (action === COM_ACTIONS.reply) {
      queue[id].resolve(payload);
      delete queue[id];
      return;
    }

    const nextRes = await handle(...payload);
    justSend(COM_ACTIONS.reply, nextRes, id);
  };

  channel.send = function (...args) {
    const id = justSend(COM_ACTIONS.send, args);
    return new Promise((resolve, reject) => {
      queue[id] = { resolve };
      if (timeout)
        setTimeout(() => {
          if (!queue[id]) return;

          reject(new Error(`Timeout ${timeout}ms`));
          delete queue[id];
        }, timeout);
    });
  };

  channel.destroy = function () {
    for (const key in queue) {
      queue[key].reject(new Error(`Destroy channel`));
      delete queue[key];
    }
  };

  if (debug) {
    channel.queue = queue;
    channel.getCurrentId = () => currentId;
  }

  return channel;
}
