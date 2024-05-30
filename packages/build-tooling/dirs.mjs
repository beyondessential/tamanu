#!/usr/bin/env node

import { existsSync, mkdirSync } from 'fs';

function createOrMakeDir(dirPath) {
  if (!existsSync(dirPath)){
    mkdirSync(dirPath);
  }
}

export function ensureDirectoryExists(dest) {
  const dirs = dest.split('/');
  dirs.pop();

  let path = '';
  dirs.forEach(dir => {
    path += `${dir}/`;
    createOrMakeDir(path);
  });
}
