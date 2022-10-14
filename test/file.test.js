/* eslint-disable */

import { expect } from 'chai';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { FileCursor } from '../src/file.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('File test', () => {
  it('should create FileCursor', async () => {
    const fc = FileCursor('some data');
    expect(`${fc}`.substring(0, 5)).to.be.eq('/tmp/');

    expect(fc.toText()).to.be.eq('some data');
    expect(fc.toStream().constructor.name).to.be.eq('ReadStream');

    const filePath = join(__dirname, './rugo.config.js');
    const fc2 = FileCursor(filePath);
    expect(`${fc2}`).to.be.eq(filePath);
  });
});
