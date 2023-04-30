import { isNil } from 'ramda';
import { Exception } from './classes.js';
import * as Classes from './make.js';

export async function pack(fn) {
  let data = undefined;
  let isThrow = false;

  if (fn) {
    try {
      data = await fn();
    } catch (err) {
      if (err instanceof Error) {
        data = new Exception(err);
      } else {
        data = err;
      }
      isThrow = true;
    }
  }

  return {
    type: isNil(data) ? 'Nil' : data.constructor.name,
    data,
    isThrow,
  };
}

export function unpack({ type, data, isThrow }) {
  if (type === Exception.name) {
    const newErr = new Error();
    newErr.name = data.name;
    newErr.message = data.message;
    newErr.stack = data.stack;
    throw newErr;
  }

  if (!Classes[`make${type}`]) throw new Error(`Invalid data type ${type}`);

  const nextData = Classes[`make${type}`](data);

  if (isThrow) throw nextData;

  return nextData;
}
