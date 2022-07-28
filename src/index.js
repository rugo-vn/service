import { resolve } from 'path';
import process from 'node:process';

import { ServiceBroker } from 'moleculer';
import { curry, mergeDeepLeft } from 'ramda';

import { parseEnv } from './env.js';

const addService = (broker, settings, service) => {
  return broker.createService({
    ...service,
    settings: mergeDeepLeft(service.settings, settings)
  });
};

const loadService = async (broker, settings) => {
  for (const serviceLocation of settings.services || []) {
    const service = await import(resolve(serviceLocation));
    broker.add(service);
  }
};

export const createRunner = (env = process.env) => {
  const broker = new ServiceBroker({
    logger: { type: 'Log4js' }
  });

  const settings = parseEnv(env);

  broker.add = curry(addService)(broker, settings);
  broker.load = () => loadService(broker, settings);

  return broker;
};
