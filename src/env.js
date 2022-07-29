import camelCase from 'camelcase';
import { ENV_PREFIX } from './constants.js';

const tryJSON = raw => {
  try {
    return JSON.parse(raw);
  } catch(_) {
    return raw;
  }
}

export const parseEnv = rawEnv => {
  const env = {};

  for (const key in rawEnv) {
    if (key.indexOf(ENV_PREFIX) === -1) { continue; }

    const name = key.substring(ENV_PREFIX.length).trim();
    const rel = /^(.*)_[0-9]+?$/gm.exec(name);
    if (!rel) {
      env[camelCase(name)] = tryJSON(rawEnv[key]);
      continue;
    }

    env[camelCase(rel[1])] ||= [];
    env[camelCase(rel[1])].push(tryJSON(rawEnv[key]));
  }

  return env;
};
