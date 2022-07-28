#!/usr/bin/env node

import dotenv from 'dotenv';
import { createRunner } from './index.js';

dotenv.config();

const runner = createRunner();

await runner.load();
await runner.start();
