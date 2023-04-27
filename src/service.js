import { runChild } from './child.js';
import { STATUSES } from './constants.js';
import { createLogger } from './utils.js';
import { createChannel } from './communicate.js';
import { curryN } from 'ramda';

async function callService(service, action, args = {}, opts = {}) {
  return await service.channel.send(action, { args, opts });
}

function startService(service) {
  return callService(service, 'start');
}

async function stopService(service) {
  await callService(service, 'stop');
  service.proc.kill();
}

export async function spawnService({ name, exec, cwd }) {
  // initialize
  let onStop = () => {};

  // init service
  const service = {};
  service.logger = createLogger(name);
  service.status = STATUSES.online;
  service.channel = createChannel({
    invoke: (msg) => {
      service.proc.stdin.write(msg);
    },
  });

  // child process
  const proc = runChild({
    exec,
    cwd,
    onData(data) {
      data = data.toString();
      const res = service.channel.parse(data);
      if (res) return service.channel.receive(res.id, res.action, res.payload);
      service.logger.info(data.trim());
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

  // before return
  service.proc = proc;
  service.call = curryN(2, callService)(service);
  service.start = () => startService(service);
  service.stop = () =>
    new Promise(async (resolve) => {
      onStop = resolve;
      await stopService(service);
    });

  return service;
}
