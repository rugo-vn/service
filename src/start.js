#!/usr/bin/env node

import fs from 'fs';
import dotenv from 'dotenv';
import { createBroker } from './index.js';
import { resolve } from 'path';

dotenv.config();

let settings = {};
if (fs.existsSync('rugo.config.js')) { settings = (await import(resolve('rugo.config.js'))).default; }

const broker = createBroker(settings);

await broker.loadServices();
await broker.start();
