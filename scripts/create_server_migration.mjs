import { promises as fs } from 'fs';
import { join } from 'path';

function toFilestem(str) {
  if (!/\s/.test(str)) return str;

  return str
    .toLowerCase()
    .replace(/([-_\s][a-z0-9])/g, group => group.toUpperCase().replace(/[-_\s]/, ''));
}

const migrationName = process.argv.slice(2).join(' ');
if (migrationName.trim().length === 0) {
  console.error('Please provide a name for the migration');
  process.exit(1);
}

const timestamp = new Date().getTime();

const templateFile = join('scripts', 'resources', 'serverMigrationTemplate.js');
const migrationFile = join(
  'packages',
  'shared',
  'src',
  'migrations',
  `${timestamp}-${toFilestem(migrationName)}.js`,
);

await fs.copyFile(templateFile, migrationFile);
console.log(`Created ${migrationFile}`);
