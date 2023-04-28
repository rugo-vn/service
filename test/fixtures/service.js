import { defineAction } from '../../src/index.js';

defineAction('start', () => {
  console.log('Process started');
  return 'ok node';
});

defineAction('benchmark', () => {
  return 'ok node benchmark';
});
