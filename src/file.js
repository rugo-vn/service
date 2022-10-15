import temp from 'temp';
import { join } from 'path';
import { createReadStream, existsSync, readFileSync, writeFileSync } from 'fs';
import { copyFile } from 'node:fs/promises';

import { RugoException } from './exception.js';

/**
 *
 * @param data
 */
export function FileCursor (data) {
  if (!(this instanceof FileCursor)) { return new FileCursor(data); }

  if (!data) { throw new RugoException('FileCursor need data info'); }

  if (data instanceof FileCursor) return new FileCursor(data._path);

  if (typeof data !== 'string') { throw new RugoException('Currently, data should be string, not support any others.'); }

  let filePath = join('/', data);
  if (!existsSync(filePath)) {
    filePath = temp.path({ suffix: '.txt', prefix: 'rugo-' });
    writeFileSync(filePath, data);
  }

  this._path = filePath;
}

// output
FileCursor.prototype.toPath = function () {
  return this._path;
};

FileCursor.prototype.toString = function () {
  return this._path;
};

FileCursor.prototype.toText = function () {
  return readFileSync(this._path).toString();
};

FileCursor.prototype.toStream = function () {
  return createReadStream(this._path);
};

FileCursor.prototype[Symbol.for('nodejs.util.inspect.custom')] = function () {
  return this.inspect();
};

FileCursor.prototype.inspect = function () {
  return 'new FileCursor("'.concat(this._path, '")');
};

FileCursor.prototype.copyTo = function (toPath) {
  return copyFile(this._path, toPath, 0);
};
