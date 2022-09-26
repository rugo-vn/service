#!/usr/bin/env node

import fs from 'fs';
import dotenv from 'dotenv';
import { createBroker } from './index.js';
import { resolve } from 'path';
import emoji from 'node-emoji';
import colors from 'colors';

dotenv.config();

let settings = {};
if (fs.existsSync('rugo.config.js')) { settings = (await import(resolve('rugo.config.js'))).default; }

const broker = createBroker(settings);

await broker.loadServices();
await broker.start();

broker.logger.info(emoji.get('tada') + colors.rainbow(' Started completely! ') + emoji.get('tada'));
