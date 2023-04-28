import { expect } from 'chai';
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

    brokerB = await createBroker({ port: 8001, endpoints: ['127.0.0.1:8000'] });
    brokerC = await createBroker({ port: 8002, endpoints: ['127.0.0.1:8001'] });
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
  });

  it('should stop brokers', async () => {
    await brokerA.close();
    await brokerB.close();
    await brokerC.close();
  });
});
