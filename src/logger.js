import colors from 'colors';
import { curry } from 'ramda';

const TYPE_COLORS = {
  info: 'cyan',
  error: 'red'
};

/**
 *
 * @param type
 * @param service
 * @param message
 */
function log (type, service, message) {
  console.log(colors[TYPE_COLORS[type]](`[${(new Date()).toISOString()}] [${service}] `) + message);
}

/**
 *
 * @param service
 */
export function createLogger (service) {
  const res = {};

  for (const type in TYPE_COLORS) {
    res[type] = curry(log)(type, service);
  }

  return res;
}
