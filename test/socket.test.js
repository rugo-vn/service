import { expect } from 'chai';
import { mkdirSync } from 'node:fs';
import { connect, createServer } from 'node:net';
import { dirname, resolve } from 'node:path';
import { rimraf } from 'rimraf';
import { createSocket } from '../src/socket.js';

describe('UNIX socket test', function () {
  let socketFile, server, client;
  let peerA, peerB;
  const stage = [];

  before(async () => {
    socketFile = resolve('.tmp/service.socket');

    rimraf.sync(dirname(socketFile));
    mkdirSync(dirname(socketFile), { recursive: true });
  });

  after(async () => {
    rimraf.sync(dirname(socketFile));
  });

  it('should create a socket server', async () => {
    server = await new Promise((resolve) => {
      const theServer = createServer((socket) => {
        console.log(`server receive new connection`);
        stage.push('new_conn');
        socket.end('bye\n');
      });

      theServer.on('error', (err) => {
        if (e.code === 'EADDRINUSE') {
          return console.error('Address in use');
        }

        console.error('server error', err);
      });

      theServer.listen(socketFile, () => {
        stage.push('up');
        console.log('server is up');
        resolve(theServer);
      });
    });

    expect(stage).to.has.members(['up']);
  });

  it('should create a client', async () => {
    client = await new Promise((resolve) => {
      const theSocket = connect(socketFile, () => {
        stage.push('conn');
        console.log(`client connected`);
        resolve(theSocket);
      });
      theSocket.on('data', (data) => {
        stage.push('data');
        console.log(`client received: ${data}`);
      });
      theSocket.on('end', () => {
        stage.push('end');
        console.log(`client disconnected`);
      });
    });

    expect(stage).to.has.members(['up', 'new_conn', 'conn']);
  });

  it('should stop socket server and client', async () => {
    client.destroy();
    await new Promise((resolve) =>
      server.close(() => {
        console.log(`server is down`);
        stage.push('down');
        resolve();
      })
    );
    expect(stage).to.has.members([
      'up',
      'new_conn',
      'conn',
      'data',
      'end',
      'down',
    ]);
  });

  it('should create socket conn from lib', async () => {
    peerA = await createSocket(socketFile);
    peerB = await createSocket(socketFile);
  });

  it('should send data between peers', async () => {
    peerA.on('data', async (...args) => {
      expect(args[0]).to.be.eq(1);
      expect(args[1]).to.be.eq('a');
      expect(args[2]).to.be.eq(true);
      return 'ok';
    });

    const res = await peerB.send(1, 'a', true);
    expect(res).to.be.eq('ok');
  });

  it('should close socket conn from lib', async () => {
    await peerA.close();
    await peerB.close();
  });
});
