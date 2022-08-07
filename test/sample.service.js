export const name = 'sample';

export const settings = {
  abc: 'def'
};

export const actions = {
  add ({ params: { a, b } }) {
    return a + b;
  },

  async getMeta (ctx) {
    return await ctx.call('sample.getMetaAgain');
  },

  getMetaAgain ({ meta }) {
    return meta;
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
