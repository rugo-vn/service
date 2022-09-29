/* eslint-disable */

import { expect } from 'chai';
import { RugoException } from '../src/index.js';

describe('Exception test', () => {
  it('should create a new error class', async () => {
    class Forbidden extends RugoException {
      constructor (message, code) {
        super(message);
        this.status = '304';
        this.code = code;
        this.source = { pointer: '' };
      }
    }

    const error = new Forbidden('This is a error message', '0001');

    expect(error).to.have.property('status', '304');
    expect(error).to.have.property('title', 'Forbidden');
    expect(error).to.have.property('detail', 'This is a error message');
    expect(error).to.have.property('code', '0001');
    expect(error).to.have.property('source');

    expect(JSON.stringify(error)).to.be.eq('{"status":"304","title":"Forbidden","detail":"This is a error message","code":"0001","source":{"pointer":""}}');
  });
});
