import { assert, expect } from 'chai';
import { STATUSES } from '../src/constants.js';
import { spawnService } from '../src/index.js';
import { createTimer } from '../src/timer.js';
import { pack } from '../src/wrap.js';

describe('Service test', function () {
  this.timeout(10000);

  let serviceA;

  it('should spawn service', async () => {
    serviceA = await spawnService({
      name: 'service-a',
      exec: ['node', 'service.js'],
      cwd: './test/fixtures',
      hook: async () => await pack(() => 'ok hook'),
      settings: {
        key: 'ok node',
      },
    });

    expect(await serviceA.start()).to.be.eq('ok node');
    expect(await serviceA.call('benchmark')).to.be.eq('ok node benchmark');

    expect(serviceA).to.has.property('status', STATUSES.online);
  });

  it('should call nested', async () => {
    const res = await serviceA.call('run');
    expect(res).to.be.eq('ok hook');
  });

  it('should calc delay duration between call', async () => {
    const loopCount = 10000;
    const timer = createTimer();
    let res;

    timer.tick();
    for (let i = 0; i < loopCount; i++) {
      res = await serviceA.call('benchmark');
    }
    timer.tick((duration) =>
      console.log(`Exec duration in Service A: ${duration / loopCount}ms/call`)
    );

    expect(res).to.be.eq('ok node benchmark');
  });

  it('should not call invalid action', async () => {
    try {
      await serviceA.call('invalid');
      assert.fail('should error');
    } catch (e) {
      expect(e).to.has.property('message', 'Invalid action "invalid"');
    }
  });

  it('should return an object have construtor', async () => {
    const res = await serviceA.call('http');
    expect(res.constructor.name).to.be.eq('HttpResponse');
    expect(res).to.be.deep.eq({ status: 200, headers: {}, body: 'ok' });

    try {
      await serviceA.call('http', { isError: true });
      assert.fail('should error');
    } catch (e) {
      expect(e).to.be.deep.eq({
        status: 403,
        headers: {},
        body: 'access denied',
      });
    }

    try {
      await serviceA.call('error');
      assert.fail('should error');
    } catch (e) {
      expect(e).to.has.property('name', 'ReferenceError');
      expect(e).to.has.property('message', 'should send error');
      expect(e).to.has.property('data');
      expect(e.data).to.has.property('paramA', 'valueA');
    }
  });

  it('should internal call', async () => {
    const res = await serviceA.call('inner');
    expect(res).to.be.eq('ok node benchmark');
  });

  it('should stop service', async () => {
    await serviceA.stop();
    expect(serviceA).to.has.property('status', STATUSES.offline);
  });

  it('should spawn service immediately', async () => {
    serviceA = await spawnService({
      name: 'service-a',
      exec: ['node', 'service.js'],
      cwd: './test/fixtures',
    });

    await serviceA.stop();
  });

  it('should spawn empty service', async () => {
    serviceA = await spawnService({
      name: 'service-a',
      exec: ['node', 'empty.js'],
      cwd: './test/fixtures',
    });

    await serviceA.stop();
  });
});
