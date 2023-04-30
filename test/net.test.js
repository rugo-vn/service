import { expect } from 'chai';
import { HttpResponse } from '../src/classes.js';
import { createPeer } from '../src/net.js';
import { pack, unpack } from '../src/wrap.js';

describe('Net test', function () {
  let peerA, peerB, peerC;

  it('should create peers', async () => {
    peerA = await createPeer({
      name: 'peer-a',
      port: 8000,
      async handle(...args) {
        const fn = () => {
          if (args[0] === 'http') return new HttpResponse({ body: 'ok' });
          return `PA: ${args[0]}`;
        };

        return await pack(() => fn());
      },
    });

    peerB = await createPeer({
      name: 'peer-b',
      port: 8001,
      async handle(...args) {
        const fn = () => {
          if (args[0] === 'http')
            throw new HttpResponse({ status: 403, body: 'access denied' });
          return `PB: ${args[0]}`;
        };
        return await pack(() => fn());
      },
      endpoints: ['127.0.0.1:8000'],
    });

    peerC = await createPeer({
      name: 'peer-c',
      port: 8002,
      async handle(...args) {
        return await pack(() => `PC: ${args[0]}`);
      },
      endpoints: ['127.0.0.1:8000', '127.0.0.1:8001'],
    });
  });

  it('should transfer data', async () => {
    const res = unpack(await peerB.send('peer-a', 'hello from b'));
    expect(res).to.be.eq(`PA: hello from b`);

    const res2 = unpack(await peerC.send('peer-a', 'hello from c'));
    expect(res2).to.be.eq(`PA: hello from c`);

    const res3 = unpack(await peerC.send('peer-b', 'hello from c'));
    expect(res3).to.be.eq(`PB: hello from c`);
  });

  it('should send and receive object', async () => {
    const res = unpack(await peerB.send('peer-a', 'http'));
    expect(res.constructor.name).to.be.eq('HttpResponse');
    expect(res).to.be.deep.eq({ status: 200, headers: {}, body: 'ok' });

    try {
      unpack(await peerC.send('peer-b', 'http'));
      assert.fail('should error');
    } catch (e) {
      expect(e).to.be.deep.eq({
        status: 403,
        headers: {},
        body: 'access denied',
      });
    }
  });

  it('should close', async () => {
    await peerA.close();
    await peerB.close();
    await peerC.close();
  });
});
