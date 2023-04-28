/**
 * Create easy bidirectional connection between two process.
 *
 * const socket = await createSocket(socketFile)
 * socket.on('data', async (...args) => {
 *   return someData;
 * });
 * const res = await socket.send(...args);
 * await socket.close();
 */

import { createServer, connect } from 'node:net';
import { createChannel } from './communicate.js';

function bindReceiver(socket) {
  if (!socket.s) return;

  socket.s.on('data', (msg) => {
    socket.channel.receive(msg);
  });
}

export async function createSocket(socketFile) {
  const socket = {};
  socket.s = null;
  socket.channel = createChannel({
    invoke(msg) {
      socket.s.write(msg + '\n');
    },

    handle(...args) {
      return socket.events.data(...args);
    },
  });
  socket.events = {};
  socket.events.data = () => {};
  socket.events.conn = () => {};

  // try to create server
  const server = await new Promise((resolve) => {
    const theServer = createServer((s) => {
      socket.s = s;
      bindReceiver(socket);
      socket.events.conn();
      resolve(theServer);
    });

    theServer.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        return resolve(null);
      }
    });

    theServer.listen(socketFile, () => {
      resolve(theServer);
    });
  });

  // if not server, then create client
  socket.s = server
    ? socket.s
    : await new Promise((resolve) => {
        const theSocket = connect(socketFile, () => {
          resolve(theSocket);
        });
        theSocket.on('data', (data) => {});
        theSocket.on('end', () => {});
      });
  bindReceiver(socket);

  socket.on = function (name, fn) {
    this.events[name] = fn.bind(this);
  };

  socket.close = async function () {
    if (socket.s) {
      socket.s.destroy();
    }
    if (server) await new Promise((resolve) => server.close(resolve));
  };

  socket.send = async (...args) => {
    if (!socket.s) throw new Error('Do not have any peer connect with this');
    return await socket.channel.send(...args);
  };

  return socket;
}
