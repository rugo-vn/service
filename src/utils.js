import util from 'node:util';
import pino from 'pino';
import pretty from 'pino-pretty';
import { exec as _exec } from 'node:child_process';
import { LOGGER_LEVELS } from './constants.js';

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
