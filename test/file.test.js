/* eslint-disable */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { assert, expect } from 'chai';
import { createBroker } from '../src/broker.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('File test', () => {
  it('should transfer file', async () => {
    const sampleFilePath = join(__dirname, './sample.service.js');
    const broker = createBroker();

    let result = '';
    broker.createService({
      name: 'receiver',

      actions: {
        async put({ path: tmpPath }) {
          result += tmpPath;
          return 'ok';
        },

        async get() {
          return sampleFilePath;
        }
      }
    });

    // start
    await broker.start();

    // put file
    const res = await broker.put('receiver.put', { data: sampleFilePath });
    expect(res).to.be.eq('ok');

    // get file
    const res2 = await broker.get('receiver.get');
    expect(res2).to.be.eq(sampleFilePath);

    expect(result).to.be.eq(sampleFilePath);

    // close
    await broker.close();
  });
});
