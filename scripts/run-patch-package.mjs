import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// Only apply patches when the target package is present (e.g. skipped in partial installs).
if (!existsSync('node_modules/@react-pdf/textkit')) {
  process.exit(0);
}

const result = spawnSync('patch-package', { stdio: 'inherit', shell: true });
process.exit(result.status ?? 1);
