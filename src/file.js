import temp from 'temp';
import base64url from 'base64url';

import { join } from 'path';
import { createReadStream, existsSync, readFileSync, writeFileSync } from 'fs';
import { copyFile } from 'node:fs/promises';
import { path } from 'ramda';

import { RugoException } from '@rugo-vn/exception';

const INVALID_PATH_REGEX = /[<>:"\\|?*\u0000-\u001F]/g; // eslint-disable-line

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

/**
 *
 * @param inputId
 */
export function FsId (inputId) {
  if (!(this instanceof FsId)) { return new FsId(inputId); }

  let workingId;

  // clone id from object
  if (typeof path(['id'], inputId) === 'string') {
    workingId = inputId.id;
  }

  // create from string
  if (typeof inputId === 'string') {
    workingId = inputId;
  }

  if (typeof workingId !== 'string') { workingId = ''; }

  // try decode path
  const decodedId = base64url.decode(workingId);
  if (INVALID_PATH_REGEX.test(decodedId)) {
    throw new RugoException('Wrong input id');
  }

  // assign id
  this.id = workingId;
}

FsId.fromPath = function (originPath) {
  const formattedPath = join('/', originPath).substring(1);
  return new FsId(base64url.encode(formattedPath));
};

// output
FsId.prototype.toPath = function () {
  return base64url.decode(this.id);
};

FsId.prototype.toString = function (format) {
  return this.id.toString(format);
};

FsId.prototype.toJSON = function () {
  return this.id;
};

FsId.prototype[Symbol.for('nodejs.util.inspect.custom')] = function () {
  return this.inspect();
};

FsId.prototype.inspect = function () {
  return 'new FsId("'.concat(this.id, '")');
};
