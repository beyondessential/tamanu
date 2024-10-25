#!/usr/bin/env node

const { execFile } = require('node:child_process');
const { join } = require('node:path');
const { promisify } = require('node:util');
const fs = require('node:fs/promises');
const { availableParallelism } = require('node:os');

const { rimraf } = require('rimraf');
const YAML = require('yaml');

const { dbConfig } = require('./dbConfig.js');
const { version } = require('../../../../package.json');

async function run(packageName) {
  console.log('-+', packageName);
  console.log(' | check database config');
  const db = await dbConfig(packageName);
  await db.client.end();

  console.log(' | delete old docs if any');
  const base = join('database', 'docs', packageName);
  await rimraf(base);

  console.log(' | make new docs dir');
  await fs.mkdir(join(base, 'config'), { recursive: true });

  console.log(' | generate dbt_project.yml');
  await fs.writeFile(
    join(base, 'dbt_project.yml'),
    YAML.stringify({
      name: 'tamanu',
      version,
      'config-version': 2,
      profile: 'tamanu',
      'model-paths': [join('..', 'model', packageName)],
      // 'macro-paths': ['dbt_packages/data_staging/macros'],
      'target-path': 'target',
      'clean-targets': ['dbt_packages', 'target'],
      models: { '+docs': { show: true } },
      sources: { tamanu: { '+enabled': true } },
    }),
  );

  console.log(' | generate packages.yml');
  await fs.writeFile(
    join(base, 'packages.yml'),
    YAML.stringify({
      packages: [
        // {
        //   git: 'git@github.com-data-staging:beyondessential/data-staging.git',
        //   revision: 'v7.0.0',
        // },
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
  await promisify(execFile)('dbt', ['deps', '--profiles-dir', 'config'], { cwd: base });

  console.log(' | run dbt docs generate');
  await promisify(execFile)('dbt', ['docs', 'generate', '--profiles-dir', 'config'], { cwd: base });

  console.log(' + done');
  console.log();
}

(async () => {
  await run('central-server');
  await run('facility-server');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
