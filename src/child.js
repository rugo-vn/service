import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export const runChild = function ({
  exec,
  cwd,
  onData = () => {},
  onError = () => {},
  onClose = () => {},
}) {
  const command = exec[0];
  const args = exec.slice(1);

  cwd = resolve(cwd || './');
  if (!existsSync(cwd)) {
    throw new Error(`Cwd not found: ${cwd}`);
  }

  const proc = spawn(command, args, {
    cwd: cwd ? resolve(cwd) : null,
  });

  proc.stdout.on('data', (data) => {
    onData(data.toString());
  });

  proc.stderr.on('data', (data) => {
    onError(data.toString());
  });

  proc.on('close', (code) => {
    onClose(code);
  });

  return proc;
};
