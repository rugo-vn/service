import { defineAction } from '../../src/index.js';

defineAction('start', () => {
  console.log('Process started');
  return 'ok';
});

defineAction('benchmark', () => {
  return 'ok';
});
