import { nanoid } from 'nanoid';
import { createPeer } from './net.js';
import { spawnService } from './service.js';

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
    services[definition.name] = await spawnService(definition);
  }

  for (const name in services) {
    await services[name].start();
    const actions = await services[name].ls();
    for (const action of actions) {
      addrs[`${name}.${action}`] = id;
    }
  }

  // peer
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
          return await broker.call(addr, args, opts);
      }
    },
  });

  for (const channelName in peer.channels) {
    const ls = await peer.send(channelName, 'ls');
    for (const key in ls) addrs[key] = ls[key];
  }

  // before return
  broker.call = async (addr, args, opts) => {
    const peerId = addrs[addr];

    if (!peerId) throw new Error(`Cannot find action ${addr}`);

    if (peerId === id) {
      const [serviceName, actionName] = addr.split('.');
      return await services[serviceName].call(actionName, args, opts);
    }

    return await peer.send(peerId, 'call', addr, args, opts);
  };

  broker.close = async () => {
    for (const name in services) {
      await services[name].stop();
    }
    await peer.close();
  };

  return broker;
}
