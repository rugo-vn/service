import { nanoid } from 'nanoid';
import { createPeer } from './net.js';
import { spawnService } from './service.js';
import { unpack } from './wrap.js';

export async function createBroker({
  port,
  endpoints = [],
  services: definitions = [],
}) {
  // init
  const id = nanoid();
  const broker = {};
  const services = {};
  const addrs = {};

  // services
  for (const definition of definitions) {
    services[definition.name] = await spawnService({
      ...definition,
      async hook(addr, args, opts) {
        return await broker.call(addr, args, opts, true);
      },
    });
  }

  for (const name in services) {
    await services[name].start();
    const actions = services[name].ls;
    for (const action of actions) {
      addrs[`${name}.${action}`] = id;
    }
  }

  // peer
  // @todo: non-peer mode
  const peer = await createPeer({
    name: id,
    port,
    endpoints,
    async handle(command, ...raw) {
      switch (command) {
        case 'ls':
          return addrs;

        case 'call':
          const [addr, args, opts] = raw;
          return await broker.call(addr, args, opts, true);
      }
    },
  });

  for (const channelName in peer.channels) {
    const ls = await peer.send(channelName, 'ls');
    for (const key in ls) addrs[key] = ls[key];
  }

  // before return
  broker.call = async (addr, args, opts, internalCall) => {
    const peerId = addrs[addr];

    if (!peerId) throw new Error(`Cannot find action ${addr}`);

    if (peerId === id) {
      const [serviceName, actionName] = addr.split('.');
      const res = await services[serviceName].call(
        actionName,
        args,
        opts,
        false
      );
      return internalCall ? res : unpack(res);
    }

    const res = await peer.send(peerId, 'call', addr, args, opts);
    return internalCall ? res : unpack(res);
  };

  broker.close = async () => {
    for (const name in services) {
      await services[name].stop();
    }
    await peer.close();
  };

  return broker;
}
