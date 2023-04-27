import { expect } from 'chai';
import { STATUSES } from '../src/constants.js';
import { spawnService } from '../src/index.js';
import { createTimer } from '../src/timer.js';

describe('Service test', function () {
  this.timeout(10000);

  let serviceA;

  it('should spawn service', async () => {
    serviceA = await spawnService({
      name: 'service-a',
      exec: ['node', 'service.js'],
      cwd: './test/fixtures',
    });

    expect(await serviceA.start()).to.be.eq('ok');
    expect(serviceA).to.has.property('status', STATUSES.online);
  });

  it('should calc delay duration between call', async () => {
    const loopCount = 10000;
    const timer = createTimer();
    let res = 'ok';

    timer.tick();
    for (let i = 0; i < loopCount; i++) {
      res = await serviceA.call('benchmark');
    }
    timer.tick((duration) =>
      console.log(`Exec duration: ${duration / loopCount}ms/call`)
    );

    expect(res).to.be.eq('ok');
  });

  it('should stop service', async () => {
    await serviceA.stop();
    expect(serviceA).to.has.property('status', STATUSES.offline);
  });
});
