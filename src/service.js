import { dirname, resolve } from 'node:path';
import { rimraf } from 'rimraf';
import { runChild } from './child.js';
import { STATUSES, INTERNAL_ACTIONS } from './constants.js';
import { createLogger } from './utils.js';
import { existsSync, mkdirSync } from 'node:fs';
import { createSocket } from './socket.js';
import { curryN } from 'ramda';
import * as Classes from './make.js';
import { Exception } from './classes.js';

async function callService(service, action, args = {}, opts = {}) {
  if (
    INTERNAL_ACTIONS.indexOf(action) === -1 &&
    service.ls.indexOf(action) === -1
  )
    throw new Error(`Invalid action "${action}"`);

  const { type, data, isThrow } = await service.socket.send(action, args, opts);

  if (type === Exception.name) {
    const newErr = new Error();
    newErr.name = data.name;
    newErr.message = data.message;
    newErr.stack = data.stack;
    throw newErr;
  }

  if (!Classes[`make${type}`]) throw new Error(`Invalid data type ${type}`);

  const nextData = Classes[`make${type}`](data);

  if (isThrow) throw nextData;

  return nextData;
}

function startService(service) {
  return callService(service, 'start');
}

async function stopService(service) {
  if (service.status === STATUSES.offline) {
    service.onStop();
  } else {
    await callService(service, 'stop');
    service.proc.kill('SIGINT');
  }

  await service.socket.close();
}

export async function spawnService({ name, exec, cwd, hook = () => {} }) {
  // initialize
  const socketPath = resolve(cwd, '.socket', `${name}.socket`);

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
  service.socket.on('data', async (...args) => {
    return await hook(...args);
  });
  service.ls = [];
  service.onStop = () => {};

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
      service.waitDone();
      service.onStop();
    },
  });

  if (service.status === STATUSES.online)
    await new Promise((resolve) => (service.waitDone = resolve));

  // before return
  service.proc = proc;
  service.call = curryN(2, callService)(service);
  service.start = () => startService(service);
  service.stop = () =>
    new Promise(async (resolve) => {
      service.onStop = resolve;
      await stopService(service);
    });

  if (service.status === STATUSES.online) {
    service.ls = await callService(service, 'ls');
  }

  return service;
}
