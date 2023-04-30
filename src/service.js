import { dirname, resolve } from 'node:path';
import { rimraf } from 'rimraf';
import { runChild } from './child.js';
import { STATUSES, INTERNAL_ACTIONS } from './constants.js';
import { createLogger } from './utils.js';
import { existsSync, mkdirSync } from 'node:fs';
import { createSocket } from './socket.js';
import { curryN } from 'ramda';
import { unpack } from './wrap.js';

async function callService(
  service,
  action,
  args = {},
  opts = {},
  isUnpack = true
) {
  if (
    INTERNAL_ACTIONS.indexOf(action) === -1 &&
    service.ls.indexOf(action) === -1
  )
    throw new Error(`Invalid action "${action}"`);

  const res = await service.socket.send(action, args, opts);

  return isUnpack ? unpack(res) : res;
}

function startService(service) {
  return callService(service, 'start', service.settings);
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

export async function spawnService({
  name,
  exec,
  cwd,
  hook = () => {},
  settings = {},
}) {
  // initialize
  const socketPath = resolve(cwd || './', '.socket', `${name}.socket`);

  rimraf.sync(socketPath);
  if (!existsSync(dirname(socketPath)))
    mkdirSync(dirname(socketPath), { recursive: true });

  // init service
  const service = {};
  service.settings = settings;
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
