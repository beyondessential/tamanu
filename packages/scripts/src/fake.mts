#!/usr/bin/env node

// .mts, not .ts: this package is CommonJS, and the CJS loader can't resolve the
// extensionless export targets of the @tamanu/* packages below.
import { initDatabase } from '@tamanu/database/services/database';
import { generateFake } from '@tamanu/fake-data/populateDb';

async function main() {
  const { program } = await import('commander');
  const { default: config } = await import('config');

  const opts = program
    .option('--rounds <number>', 'How much data to fill database with', '10')
    .option(
      '--from-tally <string>',
      'Instead of filling uniformly, use a tally to guide the distribution',
    )
    .requiredOption('--database <string>', 'The database name to connect to')
    .parse()
    .opts();

  const rounds = Number(opts.rounds);

  const db = await initDatabase({
    ...(config as any).db,
    name: opts.database,
  });

  try {
    console.time('done');
    await generateFake(db.models, rounds, opts.fromTally);
    console.timeEnd('done');
  } finally {
    await db.sequelize.close();
  }
}

if (!process.env.NODE_CONFIG_DIR) {
  throw new Error('NODE_CONFIG_DIR must be set');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
