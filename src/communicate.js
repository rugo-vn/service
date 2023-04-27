import { COM_ACTIONS, COM_PREFIX, COM_SEP } from './constants.js';

export const createSendData = function (id, action, payload) {
  return `${COM_PREFIX}${id}${COM_SEP}${encodeURIComponent(
    action
  )}${COM_SEP}${encodeURIComponent(JSON.stringify(payload))}`;
};

export const parseReceivedData = function (data) {
  data = data.toString();

  if (data[0] !== COM_PREFIX[0] || data.indexOf(COM_PREFIX) !== 0) return null;

  const ls = data.substr(COM_PREFIX.length).split(COM_SEP);
  const id = parseInt(ls[0]);
  const action = decodeURIComponent(ls[1]);
  const raw = decodeURIComponent(ls[2]);

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (_) {
    return null;
  }

  if (!id || !action) return null;

  return {
    id,
    action,
    payload,
  };
};

export const createChannel = function ({ invoke, timeout = 1000, debug }) {
  const channel = {};
  const queue = {};
  let currentId = 0;

  channel.parse = parseReceivedData;

  channel.receive = function (id, action, payload) {
    if (!queue[id] || action !== COM_ACTIONS.reply) return;

    queue[id].resolve(payload.data);
    delete queue[id];
  };

  channel.send = function (action, payload) {
    const id = ++currentId;
    const data = createSendData(id, action, payload);
    return new Promise((resolve, reject) => {
      queue[id] = { resolve };
      invoke(data);
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
};
