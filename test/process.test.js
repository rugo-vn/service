import { runChild } from '../src/child.js';

async function runChildProcess() {
  const child = runChild({
    exec: ['node', 'service.js'],
    cwd: './test/fixtures/',
    onData: (data) => console.log(`child -> parent: ` + data),
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));
  child.kill();
}

describe('Child process test', () => {
  it('should create child process', async () => {
    const child = runChild({
      exec: ['node', 'service.js'],
      cwd: './test/fixtures/',
      onData: (data) => console.log(`child -> parent: ` + data),
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));
    child.kill();
  });

  it('should wrap child process in function', async () => {
    await runChildProcess();
  });
});
