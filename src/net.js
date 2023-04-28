import { connect } from 'node:net';
import { createChannel } from './communicate.js';
import { createSocketServer, ping } from './socket.js';

async function createSocketChannel(peer, socket) {
  const channel = createChannel({
    invoke(msg) {
      socket.write(msg + '\n');
    },

    async handle(command, ...args) {
      switch (command) {
        case 'hello':
          return { name: peer.name };

        case 'exec':
          return await peer.handle(...args);
      }
    },
  });
  channel.socket = socket;

  socket.on('data', (msg) => {
    channel.receive(msg);
  });

  return channel;
}

function destroyChannel(channel) {
  channel.socket.destroy();
  channel.destroy();
}

export async function createPeer({ name, port, endpoints = [], handle }) {
  const peer = {};
  const channels = {};
  const tmpChannels = [];

  peer.name = name;
  peer.handle = handle;

  const server = port
    ? await createSocketServer(port, async (socket) => {
        const channel = await createSocketChannel(peer, socket);
        tmpChannels.push(channel);
      })
    : null;

  // connect endpoints
  for (const endpoint of endpoints) {
    const [h, p] = endpoint.split(':');
    if (!(await ping(p, h))) {
      throw new Error(`Cannot connect to endpoint ${endpoint}`);
    }

    const socket = await new Promise((resolve) => {
      const theSocket = connect(p, h, () => resolve(theSocket));
    });

    const channel = await createSocketChannel(peer, socket);
    const res = await channel.send('hello');

    if (!res) {
      destroyChannel(channel);
      endMap[currentEndpoint] = name;
      continue;
    }

    const { name: senderName } = res;
    channels[senderName] = channel;
  }

  // before return
  peer.close = async () => {
    for (const channel of tmpChannels) {
      destroyChannel(channel);
    }

    for (const channelName in channels) {
      destroyChannel(channels[channelName]);
    }

    await new Promise((resolve) => server.close(resolve));
  };
  peer.send = async (recvName, ...args) =>
    await channels[recvName].send('exec', ...args);
  peer.channels = channels;

  return peer;
}
