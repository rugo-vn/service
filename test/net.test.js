import { expect } from 'chai';
import { createPeer } from '../src/net.js';

describe('Net test', function () {
  let peerA, peerB, peerC;

  it('should create peers', async () => {
    peerA = await createPeer({
      name: 'peer-a',
      port: 8000,
      handle(...args) {
        return `PA: ${args[0]}`;
      },
    });

    peerB = await createPeer({
      name: 'peer-b',
      port: 8001,
      handle(...args) {
        return `PB: ${args[0]}`;
      },
      endpoints: ['127.0.0.1:8000'],
    });

    peerC = await createPeer({
      name: 'peer-c',
      port: 8002,
      handle(...args) {
        return `PC: ${args[0]}`;
      },
      endpoints: ['127.0.0.1:8000', '127.0.0.1:8001'],
    });
  });

  it('should transfer data', async () => {
    const res = await peerB.send('peer-a', 'hello from b');
    expect(res).to.be.eq(`PA: hello from b`);

    const res2 = await peerC.send('peer-a', 'hello from c');
    expect(res2).to.be.eq(`PA: hello from c`);

    const res3 = await peerC.send('peer-b', 'hello from c');
    expect(res3).to.be.eq(`PB: hello from c`);
  });

  it('should close', async () => {
    await peerA.close();
    await peerB.close();
    await peerC.close();
  });
});
