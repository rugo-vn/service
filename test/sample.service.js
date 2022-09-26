/* eslint-disable */

export const name = 'sample';

export const settings = {
  abc: 'def'
};

export const actions = {
  add ({ a, b }) {
    this.logger.info('add operation');
    return a + b;
  },
  getSettings () {
    return this.settings;
  }
};

/**
 *
 */
export async function started () {
  this.settings.foo = 'bar';
}
