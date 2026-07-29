import { promises as fs } from 'fs';
import { join } from 'path';

import {
  MIGRATIONS_DIR,
  lastMigrationOnDisk,
  nextPrefix,
  prefixOf,
} from './migration-names.mjs';

function toFilestem(str) {
  if (!/\s/.test(str)) return str;

  return str
    .toLowerCase()
    .replace(/([-_\s][a-z0-9])/g, (group) => group.toUpperCase().replace(/[-_\s]/, ''));
}

const migrationName = process.argv.slice(2).join(' ');
if (migrationName.trim().length === 0) {
  console.error('Please provide a name for the migration');
  process.exit(1);
}

// Migrations run in the lexical order of their filenames, so a new one has to sort after every
// existing one. That isn't automatic: hand-rounded timestamps are sometimes ahead of real time.
const last = lastMigrationOnDisk();
const timestamp = nextPrefix(last ? prefixOf(last) : 0);

const templateFile = join('scripts', 'resources', 'serverMigrationTemplate.ts');
const migrationFile = join(MIGRATIONS_DIR, `${timestamp}-${toFilestem(migrationName)}.ts`);

await fs.copyFile(templateFile, migrationFile);
console.log(`Created ${migrationFile}`);
