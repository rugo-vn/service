import { runChild } from '../src/child.js';

async function runChildProcess() {
  const child = runChild({
    exec: ['node', 'process.js'],
    cwd: './test/fixtures/',
    onData: (data) => console.log(`child -> parent: ` + data),
    onError: (data) => console.log(`error: ` + data),
  });

  await new Promise((resolve) => setTimeout(resolve, 500));
  child.kill();
}

describe('Child process test', () => {
  it('should create child process', async () => {
    const child = runChild({
      exec: ['node', 'process.js'],
      cwd: './test/fixtures/',
      onData: (data) => console.log(`child -> parent: ` + data),
      onError: (data) => console.log(`error: ` + data),
    });

    child.stdin.write('Hello');
    await new Promise((resolve) => setTimeout(resolve, 500));
    child.kill();
  });

  it('should wrap child process in function', async () => {
    await runChildProcess();
  });
});
