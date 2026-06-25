#!/usr/bin/env node

import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function ensureDirectoryExists(dest) {
  const dirPath = dirname(dest);
  if (dirPath === '.') return;
  mkdirSync(dirPath, { recursive: true });
}
