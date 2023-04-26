import { assert, expect } from 'chai';
import {
  createChannel,
  createSendData,
  parseReceivedData,
} from '../src/communicate.js';
import { COM_ACTIONS } from '../src/constants.js';

describe('Communication test', function () {
  this.timeout(10000);

  it('should create send data and parse receive data', async () => {
    const dataStr = createSendData(1, 'actionName', { hello: 'world' });
    expect(dataStr).to.be.eq(
      'data:1:actionName:%7B%22hello%22%3A%22world%22%7D'
    );

    const { id, action, payload } = parseReceivedData(dataStr);

    expect(id).to.be.eq(1);
    expect(action).to.be.eq('actionName');
    expect(payload).to.has.property('hello', 'world');
  });

  it('should create listen channel', async () => {
    const channel = createChannel({
      invoke: (msg) =>
        expect(msg).to.be.eq(
          'data:1:say:%7B%22msg%22%3A%22Hello%2C%20World!%22%7D'
        ),
    });

    expect(channel).not.to.has.property('queue');

    setTimeout(() => {
      const res = channel.parse(
        'data:1:reply:%7B%22data%22%3A%22Hello%2C%20World!%22%7D'
      );
      if (res?.action !== COM_ACTIONS.reply) return;
      channel.receive(res.id, res.action, res.payload);
    }, 500);

    const res = await channel.send('say', { msg: 'Hello, World!' });
    expect(res).to.be.eq('Hello, World!');
  });

  it('should clear timeout listener', async () => {
    const channel = createChannel({
      invoke: (msg) =>
        expect(msg).to.be.eq(
          'data:1:say:%7B%22msg%22%3A%22Hello%2C%20World!%22%7D'
        ),
      debug: true,
    });

    try {
      await channel.send('say', { msg: 'Hello, World!' });
      assert('should error');
    } catch (err) {
      expect(err).to.has.property('message', 'Timeout 1000ms');
    }

    expect(Object.keys(channel.queue).length).to.be.eq(0);
  });
});
