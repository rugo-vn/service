import { resolve } from 'path';

import { clone, mergeDeepLeft } from 'ramda';
import { createLogger } from './logger.js';

/**
 *
 * @param context
 * @param service
 */
export function addService (context, service) {
  service = clone({ ...service });

  service.settings = mergeDeepLeft(service.settings, context.settings);
  service.logger = createLogger(service.name);
  service.runner = context;

  for (const methodName in service.methods || {}) {
    service[methodName] = service.methods[methodName].bind(service);
  }

  context.services.push(service);
}

/**
 *
 * @param context
 */
export async function loadService (context) {
  const { settings } = context;

  for (const serviceLocation of settings.services || []) {
    const service = await import(resolve(serviceLocation));
    addService(context, service);
  }
}
