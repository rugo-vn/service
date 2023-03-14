import { createLogger } from '../src/utils.js';

describe('Log test', () => {
  it('should log', async () => {
    const logger = createLogger('test');

    logger.http('this is a log string');
    logger.debug('this is a log string');
    logger.info('this is a log string');
    logger.warn('this is a log string');
    logger.error('this is a log string');
    logger.fatal('this is a log string');
  });
});
