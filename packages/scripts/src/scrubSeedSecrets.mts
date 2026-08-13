#!/usr/bin/env node

// Clears the secrets migrate provisioned, so the snapshot taken from a seed build ships
// none of them: they are encrypted with that build's key file, which never leaves it, and
// a deploy restoring the snapshot provisions its own under its own key file.

import config from 'config';
import type { Sequelize } from '@tamanu/database';
import { initDatabase } from '@tamanu/database/services/database';
import { resolveDbConfig } from '@tamanu/database/services/connectionConfig';

// Cleared secrets can't decrypt anything left behind, so refuse to ship a snapshot
// whose facts or settings still hold encrypted values.
const OTHER_ENCRYPTABLE_TABLES = ['local_system_facts', 'settings'];

const queryKeys = async (sequelize: Sequelize, sql: string): Promise<string[]> => {
  const [rows] = await sequelize.query(sql);
  return (rows as { key: string }[]).map(({ key }) => key);
};

async function scrubSeedSecrets(sequelize: Sequelize): Promise<string[]> {
  const encrypted: string[] = [];
  for (const table of OTHER_ENCRYPTABLE_TABLES) {
    const keys = await queryKeys(
      sequelize,
      `SELECT key FROM ${table} WHERE deleted_at IS NULL AND ltrim(value::text, '"') LIKE 'S1:%'`,
    );
    encrypted.push(...keys.map(key => `${table}.${key}`));
  }
  if (encrypted.length > 0) {
    throw new Error(
      `Encrypted values remain in the seeded database and only this build's key file can ` +
        `read them: ${encrypted.join(', ')}`,
    );
  }

  // Hard delete: the unique index on `key` ignores deleted_at, so a soft-deleted row
  // would leave setIfAbsent a silent no-op and the secret would never be reprovisioned.
  return queryKeys(sequelize, 'DELETE FROM local_system_secrets RETURNING key');
}

async function main() {
  const { sequelize } = await initDatabase({
    ...resolveDbConfig((config as any).db),
    alwaysCreateConnection: false,
  });

  try {
    const cleared = await scrubSeedSecrets(sequelize);
    console.log('Cleared seed secrets:', cleared.join(', ') || 'none');
  } finally {
    await sequelize.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
