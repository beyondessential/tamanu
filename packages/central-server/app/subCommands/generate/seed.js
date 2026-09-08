import { Command } from 'commander';
import { generateFake } from '@tamanu/fake-data/populateDb';

import { closeDatabase, initDatabase } from '../../database';

const ALLOW_FAKE_DATA = 'TAMANU_ALLOW_FAKE_DATA';

export const generateSeed = async ({ rounds }) => {
  if (process.env.NODE_ENV === 'production' && process.env[ALLOW_FAKE_DATA] !== 'true') {
    throw new Error(
      `generate seed writes fake clinical data, so under NODE_ENV=production it runs only with ${ALLOW_FAKE_DATA}=true`,
    );
  }

  const store = await initDatabase({ testMode: false });
  try {
    await generateFake(store.models, Number(rounds));
  } finally {
    if (process.env.NODE_ENV !== 'test') {
      await closeDatabase();
    }
  }
};

export const seedCommand = new Command('seed')
  .description('Add fake data of every type to an existing database')
  .option('-r, --rounds <number>', 'rounds of one-of-each to generate', '3')
  .action(generateSeed);
