import { dirname, resolve } from 'node:path';
import { rimraf } from 'rimraf';
import { runChild } from './child.js';
import { STATUSES } from './constants.js';
import { createLogger } from './utils.js';
import { existsSync, mkdirSync } from 'node:fs';
import { createSocket } from './socket.js';
import { curryN } from 'ramda';

async function callService(service, action, args = {}, opts = {}) {
  return await service.socket.send(action, args, opts);
}

function startService(service) {
  return callService(service, 'start');
}

async function stopService(service) {
  await callService(service, 'stop');
  service.proc.kill('SIGINT');
  await service.socket.close();
}

export async function spawnService({ name, exec, cwd }) {
  // initialize
  const socketPath = resolve(cwd, '.socket', `${name}.socket`);
  let onStop = () => {};

  rimraf.sync(socketPath);
  if (!existsSync(dirname(socketPath)))
    mkdirSync(dirname(socketPath), { recursive: true });

  // init service
  const service = {};
  service.logger = createLogger(name);
  service.status = STATUSES.online;
  service.socket = await createSocket(socketPath);
  service.waitDone = () => {};
  service.socket.on('conn', () => service.waitDone());

  // child process
  const proc = runChild({
    exec: [...exec, '--socket', socketPath],
    cwd,
    onData(data) {
      service.logger.info(data.toString().trim());
    },
    onError(data) {
      service.logger.error(data.toString().trim());
    },
    onClose(code) {
      service.status = STATUSES.offline;
      if (code === null) {
        service.logger.info(`Exited normally.`);
      } else {
        service.logger.error(`Exited with code ${code}`);
      }
      onStop();
    },
  });

  await new Promise((resolve) => (service.waitDone = resolve));

  // before return
  service.proc = proc;
  service.call = curryN(2, callService)(service);
  service.start = () => startService(service);
  service.ls = () => callService(service, 'ls');
  service.stop = () =>
    new Promise(async (resolve) => {
      onStop = resolve;
      await stopService(service);
    });

  return service;
}
