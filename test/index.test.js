/* eslint-disable */

import { assert, expect } from 'chai';
import { createRunner } from '../src/index.js';
import * as sample from './sample.service.js';

describe('Rugo service test', () => {
  it('should simple run in file', async () => {
    const runner = createRunner();
    runner.add(sample);

    await runner.start();

    // simple add
    const result = await runner.call('sample.add', { a: 1, b: 2 });
    expect(result).to.be.eq(3);

    // list service
    const list = await runner.call('$node.services');
    expect(list.map(item => item.name)).is.members(['sample', '$node']);

    // get meta
    const meta = await runner.call('sample.getMeta', null, { meta: { foo: 'bar' } });
    expect(meta).to.has.property('foo', 'bar');

    await runner.stop();
  });

  it('should get settings from env', async () => {
    const runner = createRunner({ RUGO_PORT: 3000 });
    runner.add(sample);

    await runner.start();

    const result = await runner.call('sample.getSettings');
    expect(result).to.has.property('abc', 'def');
    expect(result).to.has.property('port', 3000);

    await runner.stop();
  });

  it('should not call invalid action', async () => {
    const runner = createRunner();
    runner.add(sample);

    await runner.start();

    try {
      await runner.call('sample.subtract', { a: 1, b: 2 });
      assert.fail();
    } catch (e) {
      expect(e).to.has.property('message', 'Service \'sample.subtract\' is not found.');
    }

    await runner.stop();
  });

  it('should auto load services', async () => {
    const runner = createRunner({ RUGO_SERVICES_0: './test/sample.service.js' });

    await runner.load();
    await runner.start();

    const result = await runner.call('sample.add', { a: 1, b: 2 });
    expect(result).to.be.eq(3);

    await runner.stop();
  });
});
