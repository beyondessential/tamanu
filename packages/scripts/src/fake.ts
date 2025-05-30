#!/usr/bin/env node

import type { Models, Sequelize } from '@tamanu/database';
import { generateEachDataType, populateDbFromTallyFile } from '@tamanu/fake-data/populateDb';

/** Generate fake data to exercise the whole database */
export async function generateFake(
  sequelize: Sequelize,
  models: Models,
  rounds: number = 1,
  tallyFilePath?: string,
) {
  console.log('Fill database with fake data', rounds, 'rounds');
  if (tallyFilePath) console.log('Using tally file:', tallyFilePath);

  let done = 0;
  let errs = 0;
  while (done < rounds && errs < Math.max(10, rounds / 10)) {
    try {
      if (tallyFilePath) {
        done += 1; // with tally, we don't want to retry errors
        await populateDbFromTallyFile(models, tallyFilePath);
      } else {
        await generateEachDataType(models);
        done += 1;
      }
      process.stdout.write('.');
    } catch (err) {
      console.error(err);
      process.stdout.write('!');
      errs += 1;
    }
  }

  if (done < rounds && errs > 0) {
    throw new Error('encountered too many errors');
  }

  console.log();
}

async function main() {
  const { program } = await import('commander');
  const { default: config } = await import('config');
  const { initDatabase } = require('@tamanu/database/services/database');

  const opts = program
    .option('--rounds <number>', 'How much data to fill database with', '10')
    .option(
      '--from-tally <string>',
      'Instead of filling uniformly, use a tally to guide the distribution',
    )
    .requiredOption('--database <string>', 'The database name to connect to')
    .parse()
    .opts();

  const rounds = Math.max(1, parseInt(opts.rounds));

  const db = await initDatabase({
    ...(config as any).db,
    name: opts.database,
  });

  try {
    console.time('done');
    await generateFake(db.sequelize, db.models, rounds, opts.fromTally);
    console.timeEnd('done');
  } finally {
    await db.sequelize.close();
  }
}

if (process.env.NODE_CONFIG_DIR) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
