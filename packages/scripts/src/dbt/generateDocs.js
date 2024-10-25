#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const { join } = require('node:path');
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
  await fs.mkdir(join(base, 'stub'), { recursive: true });

  console.log(' | generate dbt_project.yml');
  await fs.writeFile(
    join(base, 'dbt_project.yml'),
    YAML.stringify({
      name: 'tamanu',
      version,
      'config-version': 2,
      profile: 'tamanu',
      'model-paths': [...(await sourceFolders(packageName)).map(path => join('..', '..', '..', path)), 'stub'],
      // 'macro-paths': ['dbt_packages/data_staging/macros'],
      'target-path': 'target',
      'clean-targets': ['dbt_packages', 'target'],
      models: { '+docs': { show: true } },
      sources: { tamanu: { '+enabled': true } },
    }),
  );

  console.log(' | generate packages.yml');
  const packages = [
    // {
    //   git: 'git@github.com-data-staging:beyondessential/data-staging.git',
    //   revision: 'v7.0.0',
    // },
  ];
  await fs.writeFile(join(base, 'packages.yml'), YAML.stringify({ packages }));

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

  console.log(' | generate stub model');
  await stubModel(packageName, join(base, 'stub'));

  if (packages.length) {
    console.log(' | run dbt deps');
    if (
      spawnSync('dbt', ['deps', '--profiles-dir', 'config'], {
        cwd: base,
        stdio: ['pipe', 'inherit', 'inherit'],
      }).status
    )
      throw '';
  }

  console.log(' | run dbt docs generate');
  if (
    spawnSync('dbt', ['docs', 'generate', '--profiles-dir', 'config'], {
      cwd: base,
      stdio: ['pipe', 'inherit', 'inherit'],
    }).status
  )
    throw '';

  console.log(' + done');
  console.log();
}

async function sourceFolders(packageName) {
  const folders = [];
  const source = join('database', 'model', packageName);
  const schemaDirs = await fs.readdir(source, { withFileTypes: true });
  for (const schemaDir of schemaDirs) {
    if (!schemaDir.isDirectory()) continue;
    folders.push(join(source, schemaDir.name));
  }
  return folders;
}

// We generate a stub model which makes zero-sized tables from every single source table, so that
// dbt will generate docs. Unfortunately there's no way to get dbt to just generate docs for sources
// on its own without this coaxing.
async function stubModel(packageName, base) {
  for (const schemaDir of await sourceFolders(packageName)) {
    const tableFiles = await fs.readdir(schemaDir, { withFileTypes: true });
    for (const tableFile of tableFiles) {
      if (!tableFile.isFile()) continue;
      if (!tableFile.name.endsWith('.yml')) continue;
      const table = YAML.parse(
        await fs.readFile(join(schemaDir, tableFile.name), { encoding: 'utf-8' }),
      );

      const filename = `stub__${table.sources[0].schema}__${table.sources[0].tables[0].name}`;
      const sql = `SELECT count(*) FROM {{ source("${table.sources[0].name}", "${table.sources[0].tables[0].name}") }}`;
      const yml = YAML.stringify({
        version: 2,
        models: [
          {
            name: filename,
            description: table.sources[0].tables[0].description,
            tags: table.sources[0].tables[0].tags,
            columns: [],
          },
        ],
      });

      await fs.writeFile(join(base, `${filename}.sql`), sql);
      await fs.writeFile(join(base, `${filename}.yml`), yml);
    }
  }
}

(async () => {
  await run('central-server');
  await run('facility-server');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
