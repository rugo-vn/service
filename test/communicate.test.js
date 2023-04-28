import { expect } from 'chai';
import { createChannel } from '../src/communicate.js';

describe('Communicate test', function () {
  it('should create a communicate channel, send and receive', async () => {
    const channel = createChannel({
      invoke(msg) {
        /* invoke send message */
        const res = channel.parse(msg);
        expect(res).to.has.property('id');
        expect(res).to.has.property('action', 'send');
        expect(res).to.has.property('payload');
      },

      handle(...args) {
        expect(args[0]).to.be.eq('hello');
      },
    });

    // delay response
    setTimeout(() => {
      channel.receive(`{"id":1,"action":"reply","payload":"ok"}`);
      channel.receive(`{"id":1,"action":"send","payload":["hello"]}`);
    }, 500);

    // create request
    const res = await channel.send('a', 1, true, {}, []);
    expect(res).to.be.eq('ok');
  });
});
