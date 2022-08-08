import colors from 'colors';
import { curry } from 'ramda';

const TYPE_COLORS = {
  info: 'cyan',
  error: 'red'
}

function log(type, service, message){
  console.log(colors[TYPE_COLORS[type]](`[${(new Date()).toISOString()}] [${service}] `) + message);
}

export function createLogger (service) {
  const res = {};
  
  for (let type in TYPE_COLORS){
    res[type] = curry(log)(type, service)
  }

  return res;
}