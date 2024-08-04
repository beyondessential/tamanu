#!/usr/bin/env node

// This expects to be run in the production docker build in /Dockerfile.

import { spawnSync } from 'node:child_process';
import * as path from 'node:path';
import { createReadStream, createWriteStream } from 'node:fs';
import * as fs from 'node:fs/promises';
import * as stream from 'node:stream';
import * as util from 'node:util';
import * as zlib from 'node:zlib';
import { listPackages } from './list-packages.mjs';
import { exit } from 'node:process';
const pipeline = util.promisify(stream.pipeline);

const TAMANU_ROOT = 'C:\\tamanu';

async function common() {
  // let build-tooling be installed in production mode
  const packageJson = JSON.parse(await fs.readFile('package.json'));
  packageJson['dependencies']['@tamanu/build-tooling'] = '*';
  await fs.writeFile('package.json', JSON.stringify(packageJson, null, '  '));

  // put cache in packages / so it's carried between stages
  spawnSync('yarn', ['config', 'set', 'cache-folder', path.join(TAMANU_ROOT, 'packages', '.yarn-cache')], { stdio: 'inherit', shell: true });

  // install dependencies
  spawnSync('yarn', ['install', '--non-interactive', '--frozen-lockfile'], { stdio: 'inherit', shell: true });
}

async function remove_irrelevant_packages(targetPackage) {
  // remove from yarn workspace list all packages that aren't the ones we're building
  const packages = listPackages({ noShared: true, paths: true });
  const unwanted = packages.filter((p) => !p.endsWith(targetPackage));

  // erase from the package.json
  const packageJson = JSON.parse(await fs.readFile('package.json'));
  packageJson['workspaces']['packages'] = packageJson['workspaces']['packages'].filter((p) => !unwanted.includes(p));

  // erase from the filesystem
  const promises = [
    ...unwanted,
    'packages/.new-package'
  ].map((p) => fs.rm(p, { recursive: true, force: true }));
  await Promise.all(promises);

  await fs.writeFile('package.json', JSON.stringify(packageJson, null, '  '));
}

async function build_server(targetPackage) {
  // clear out the tests and files not useful for production
  const devArtifactsRm = (await fs.readdir('packages')).map(async (packageName) => {
    const packagePath = path.join('packages', packageName);
    const jests = (await fs.readdir(packagePath)).filter((p) => p.startsWith('jest'));
    let config = [];
    try {
      config = (await fs.readdir(path.join(packagePath, 'config')))
        .filter((p) => p.match(/^(local|development|test)/g))
        .map((c) => path.join('config', c));
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
    return [
      '__tests__',
      ...jests,
      'docker',
      'coverage',
      ...config,
    ].map((p) => path.join(packagePath, p));
  }).map(async (ps) => {
    const promises = (await ps).map((p) => fs.rm(p, { recursive: true, force: true }));
    await Promise.all(promises);
  });
  await Promise.all(devArtifactsRm);

  await remove_irrelevant_packages(targetPackage);

  // build the world
  spawnSync('yarn', ['build'], { stdio: 'inherit', shell: true });

  // clear out the build-tooling
  const packagesNodeModules = (await fs.readdir('packages'))
    .map((p) => path.join('packages', p, 'node_modules', '@tamanu', 'build-tooling'));
  const toolingArtifactsRm = [
    'node_modules/@tamanu/build-tooling',
    'packages/build-tooling',
    ...packagesNodeModules,
  ].map((p) => fs.rm(p, { recursive: true, force: true }));
  await Promise.all(toolingArtifactsRm);

  const buildConfigRm = (await fs.readdir('packages')).map(async (packageName) => {
    const packagePath = path.join('packages', packageName);
    return (await fs.readdir(packagePath))
      .filter((p) => p.match(/.config\./g));
  }).map(async (ps) => {
    const promises = (await ps).map((p) => fs.rm(p, { force: true }));
    await Promise.all(promises);
  });
  await Promise.all(buildConfigRm);

  // remove build-tooling from top package.json
  const packageJson = JSON.parse(await fs.readFile('package.json'));
  packageJson['dependencies']['@tamanu/build-tooling'] = undefined;
  await fs.writeFile('package.json', JSON.stringify(packageJson, null, '  '));

  // remove build dependencies
  spawnSync('yarn', ['install', '--non-interactive', '--frozen-lockfile'], { stdio: 'inherit', shell: true });

  // cleanup
  spawnSync('yarn', ['cache', 'clean'], { stdio: 'inherit', shell: true });
  spawnSync('yarn', ['config', 'delete', 'cache-folder'], { stdio: 'inherit', shell: true });
  await fs.rm('packages/.yarn-cache', { recursive: true, force: true });
  await fs.rm(import.meta.filename, { force: true });
}

async function precompress_assets(root) {
  if (!root) {
    root = '.';
  }

  const promises = (await fs.readdir(root, { withFileTypes: true, recursive: true }))
    .filter((p) => p.name.match(/(\.css|\.eot|\.ico|\.js|\.svg|\.ttf|\.html)$/g))
    .map((p) => {
      const input = path.join(p.parentPath, p.name);
      console.log("precompressing %s", input);
      return Promise.all([
          pipeline(
            createReadStream(input),
            zlib.createGzip({ level: zlib.constants.Z_BEST_COMPRESSION }),
            createWriteStream(input.concat('.gz'))
          ),
          pipeline(
            createReadStream(input),
            zlib.createBrotliCompress({ params: {
              [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY
            } }),
            createWriteStream(input.concat('.br'))
          ),
          // TODO: support zstd.It's not in node's zlib yet. Use command-line?
      ]);
    });
  Promise.all(promises);
}

async function build_web() {
  spawnSync('yarn', ['build-shared'], { stdio: 'inherit', shell: true });
  spawnSync('yarn', ['workspace', '@tamanu/web-frontend', 'build'], { stdio: 'inherit', shell: true });
  await precompress_assets('packages/web/dist');
}

const targetPackage = process.argv[2];
if (!targetPackage) {
  console.log("Expected target or package path");
  exit();
}

await common();

if (targetPackage === 'web') {
  await build_web();
} else {
  await build_server(targetPackage);
}
