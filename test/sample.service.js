/* eslint-disable */

import { RugoException, ServiceError } from "../src/index.js";

export const name = 'sample';

export const settings = {
  abc: 'def'
};

export const hooks = {
  error: {
    all(err){
      
    }
  }
}

export const actions = {
  add ({ a, b }) {
    this.logger.info('add operation');
    return a + b;
  },
  getSettings () {
    return this.settings;
  },
  throwError () {
    throw new Error('This is error throw from action.');
  },
  throwRugoException () {
    throw new RugoException('This is rugo error throw from action.');
  },
  throwServiceError () {
    throw new ServiceError('This is service error throw from action.');
  }
};

/**
 *
 */
export async function started () {
  this.settings.foo = 'bar';
}
