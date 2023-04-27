import { createBroker } from '../src/index.js';

describe('Broker test', () => {
  let brokerA, brokerB;
  it('should create brokers', async () => {
    brokerA = createBroker();
    brokerB = createBroker();
  });
});
