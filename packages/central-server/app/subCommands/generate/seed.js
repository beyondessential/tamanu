import { Command } from 'commander';
import { generateFake } from '@tamanu/fake-data/populateDb';

import { closeDatabase, initDatabase } from '../../database';

export const generateSeed = async ({ rounds }) => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'generate seed writes fake clinical data, so it refuses to run with NODE_ENV=production',
    );
  }

  const store = await initDatabase({ testMode: false });
  try {
    await generateFake(store.models, Math.max(1, Number.parseInt(rounds, 10)));
  } finally {
    if (process.env.NODE_ENV !== 'test') {
      await closeDatabase();
    }
  }
};

export const seedCommand = new Command('seed')
  .description('Add one of each data type to an existing database')
  .option('-r, --rounds <number>', 'how many rounds of one-of-each to generate', 3)
  .action(generateSeed);
