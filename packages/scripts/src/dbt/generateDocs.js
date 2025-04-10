#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const { join } = require('node:path');
const fs = require('node:fs/promises');
const { availableParallelism } = require('node:os');

const { rimraf } = require('rimraf');
const YAML = require('yaml');

const { dbConfig } = require('./dbConfig.js');
const { version } = require('../../../../package.json');

async function run() {
  console.log('-+');
  console.log(' | check database config');
  const db = await dbConfig('central-server');
  await db.client.end();

  console.log(' | delete old docs if any');
  const base = join('database', 'docs');
  await rimraf(base);

  console.log(' | make new docs dir');
  await fs.mkdir(join(base, 'config'), { recursive: true });
  await fs.mkdir(join(base, 'stub'), { recursive: true });

  console.log(' | generate dbt_project.yml');
  await fs.writeFile(
    join(base, 'dbt_project.yml'),
    YAML.stringify({
      name: 'tamanu',
      version,
      'config-version': 2,
      profile: 'tamanu',
      'model-paths': (await sourceFolders()).map(path => join( '..', '..', path)),
      'target-path': 'target',
      'clean-targets': ['dbt_packages', 'target'],
      sources: { tamanu: { '+enabled': true } },
    }),
  );

  console.log(' | generate packages.yml');
  await fs.writeFile(
    join(base, 'packages.yml'),
    YAML.stringify({
      packages: [
        { package: 'dbt-labs/dbt_utils', version: '1.3.0' },
      ],
    }),
  );

  console.log(' | generate profiles.yml');
  await fs.writeFile(
    join(base, 'config', 'profiles.yml'),
    YAML.stringify({
      tamanu: {
        target: 'tamanu',
        outputs: {
          tamanu: {
            type: 'postgres',
            threads: availableParallelism(),
            host: db.host ?? 'localhost',
            port: db.port ?? 5432,
            user: db.username,
            pass: db.password,
            dbname: db.name,
            schema: 'dbt',
          },
        },
      },
    }),
  );

  console.log(' | run dbt deps');
  if (
    spawnSync('dbt', ['deps', '--profiles-dir', 'config'], {
      cwd: base,
      stdio: ['pipe', 'inherit', 'inherit'],
    }).status
  )
    throw '';

  console.log(' | run dbt docs generate');
  if (
    spawnSync('dbt', ['docs', 'generate', '--profiles-dir', 'config', '--static'], {
      cwd: base,
      stdio: ['pipe', 'inherit', 'inherit'],
    }).status
  )
    throw '';

  console.log(' + done');
  console.log();
}

async function sourceFolders() {
  const folders = [];
  const source = join('database', 'model');
  const schemaDirs = await fs.readdir(source, { withFileTypes: true });
  for (const schemaDir of schemaDirs) {
    if (!schemaDir.isDirectory()) continue;
    folders.push(join(source, schemaDir.name));
  }
  return folders;
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
