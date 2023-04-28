import { defineAction, callAction } from '../../src/index.js';

defineAction('start', () => {
  console.log('Process started');
  return 'ok node';
});

defineAction('benchmark', function () {
  return 'ok node benchmark';
});

defineAction('run', async function () {
  return await callAction('service-a.benchmark');
});

defineAction('step', async function ({ step }, opts) {
  if (step === 0) return 'step-0';

  const addr = step === 1 ? 'service-a.step' : 'service-b.step';
  let ext = opts.ext || '';
  if (step % 2 === 0) ext += 'x';

  return `step-${step} ${ext}> (${addr}) ${await this.call(
    addr,
    {
      step: step - 1,
    },
    ext ? { ext } : {}
  )}`;
});
