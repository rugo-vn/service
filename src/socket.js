/**
 * Create easy bidirectional connection between two process.
 *
 * const socket = await createSocket(pathOrPort)
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

export async function createSocketServer(pathOrPort, fn) {
  return await new Promise((resolve, reject) => {
    const theServer = createServer(fn);

    theServer.on('error', (e) => {
      reject(e);
    });

    theServer.listen(pathOrPort, () => {
      resolve(theServer);
    });
  });
}

export async function createSocket(pathOrPort, host) {
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
  let server;
  try {
    server = await createSocketServer(pathOrPort, (s) => {
      socket.s = s;
      bindReceiver(socket);
      socket.events.conn();
    });
  } catch (e) {
    if (e.code !== 'EADDRINUSE') {
      throw e;
    }
  }

  // if not server, then create client
  socket.s = server
    ? socket.s
    : await new Promise((resolve) => {
        const theSocket = host
          ? connect(pathOrPort, host, () => {
              resolve(theSocket);
            })
          : connect(pathOrPort, () => {
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

export async function ping(pathOrPort, host) {
  try {
    const socket = await new Promise((resolve, reject) => {
      const theSocket = host
        ? connect(pathOrPort, host, () => {
            resolve(theSocket);
          })
        : connect(pathOrPort, () => {
            resolve(theSocket);
          });

      theSocket.on('error', () => {
        reject(theSocket);
      });
    });
    socket.destroy();
    return true;
  } catch (e) {
    e.destroy();
    return false;
  }
}
