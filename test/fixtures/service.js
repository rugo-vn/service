import { HttpResponse } from '../../src/classes.js';
import { defineAction, callAction } from '../../src/index.js';

defineAction('start', (settings) => {
  console.log('Process started');
  console.log(settings);
  return settings.key;
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

defineAction('http', async function ({ isError }) {
  if (isError) throw new HttpResponse({ status: 403, body: 'access denied' });
  return new HttpResponse({ body: 'ok' });
});

defineAction('error', async function () {
  throw new ReferenceError('should send error');
});

defineAction('retire', async function () {
  await this.call('service-a.http', { isError: true });
  return 'ok retired';
});

defineAction('inner', async function () {
  return await this.call('benchmark');
});
