import { assert, expect } from 'chai';
import { createBroker } from '../src/index.js';
import { createTimer } from '../src/timer.js';

describe('Broker test', function () {
  this.timeout(10000);

  let brokerA, brokerB, brokerC;

  it('should create brokers', async () => {
    brokerA = await createBroker({
      port: 8000,
      services: [
        {
          name: 'service-a',
          exec: ['node', 'service.js'],
          cwd: './test/fixtures',
        },
      ],
    });

    brokerB = await createBroker({
      port: 8001,
      services: [
        {
          name: 'service-b',
          exec: ['node', 'service.js'],
          cwd: './test/fixtures',
        },
      ],
      endpoints: ['127.0.0.1:8000'],
    });
    brokerC = await createBroker({
      port: 8002,
      services: [
        {
          name: 'service-c',
          exec: ['node', 'service.js'],
          cwd: './test/fixtures',
        },
      ],
      endpoints: ['127.0.0.1:8001'],
    });
  });

  it('should call', async () => {
    const LOOP_COUNT = 10000;
    const timer = createTimer();
    let res;

    // internal call
    timer.tick();
    for (let i = 0; i < LOOP_COUNT; i++) {
      res = await brokerA.call('service-a.benchmark');
    }
    timer.tick((duration) =>
      console.log(
        `Exec duration in internal call: ${duration / LOOP_COUNT}ms/call`
      )
    );

    expect(res).to.be.eq('ok node benchmark');

    // external call
    timer.tick();
    for (let i = 0; i < LOOP_COUNT; i++) {
      res = await brokerB.call('service-a.benchmark');
    }
    timer.tick((duration) =>
      console.log(
        `Exec duration in external call: ${duration / LOOP_COUNT}ms/call`
      )
    );
    expect(res).to.be.eq('ok node benchmark');

    // nested call
    timer.tick();
    for (let i = 0; i < LOOP_COUNT; i++) {
      res = await brokerC.call('service-b.run');
    }
    timer.tick((duration) =>
      console.log(
        `Exec duration in nested call: ${duration / LOOP_COUNT}ms/call`
      )
    );
    expect(res).to.be.eq('ok node benchmark');
  });

  it('should nested call with throwable', async () => {
    // nested call with throw
    try {
      await brokerC.call('service-b.retire');
      assert.fail('should error');
    } catch (e) {
      expect(e).to.be.deep.eq({
        status: 403,
        headers: {},
        body: 'access denied',
      });
    }
  });

  it('should transfer data', async () => {
    const timer = createTimer();

    timer.tick();
    const res = await brokerC.call('service-c.step', { step: 4 });
    timer.tick((d) => console.log(`Total call ${d}ms`));

    expect(res).to.be.eq(
      'step-4 x> (service-b.step) step-3 x> (service-b.step) step-2 xx> (service-b.step) step-1 xx> (service-a.step) step-0'
    );
  });

  it('should stop brokers', async () => {
    await brokerA.close();
    await brokerB.close();
    await brokerC.close();
  });
});
