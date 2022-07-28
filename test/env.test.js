/* eslint-disable */

import { expect } from 'chai';
import { parseEnv } from '../src/env.js';

describe('Parse env test', () => {
  it('should parse', async () => {
    const env = parseEnv({
      NOT_INCLUDE: 'test',
      RUGO_PORT: 3000,
      RUGO_SERVICES_0: 'A',
      RUGO_SERVICES_1: 'B',
      RUGO_SERVICES_2: 'C',
      RUGO_SERVICES_5: 'D'
    });

    expect(env).not.to.has.property('notInclude');
    expect(env).to.has.property('port', 3000);
    expect(env).to.has.property('services');
    expect(env.services).to.has.property('length', 4);
  });
});
