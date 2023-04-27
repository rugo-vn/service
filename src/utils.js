import util from 'node:util';
import pino from 'pino';
import pretty from 'pino-pretty';
import { exec as _exec } from 'node:child_process';
import { COM_PREFIX, LOGGER_LEVELS } from './constants.js';

export const exec = util.promisify(_exec);

export const createLogger = (name) => {
  return pino(
    {
      customLevels: LOGGER_LEVELS,
      useOnlyCustomLevels: true,
      level: 'http',
    },
    pretty({
      colorize: true,
      ignore: 'pid,hostname',
      customPrettifiers: {
        name(name) {
          if (name[0] === '_') {
            // system service
            return colors.red(name.substring(1));
          }

          return name;
        },
      },
    })
  ).child({ name });
};

export const rawToJson = (raw) => {
  const plainText = data.toString();
  if (plainText[0] === COM_PREFIX[0] && plainText.indexOf(COM_PREFIX) === 0) {
    let comData;
    try {
      comData = JSON.parse(plainText.substr(COM_PREFIX.length));
    } catch (_) {}

    if (comData) {
      return comData;
    }
  }
  return null;
};
