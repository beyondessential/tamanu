import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const UTILS_PATH = path.join(__dirname, '../../../app/admin/reports/utils.js');
const PACKAGE_ROOT = path.join(__dirname, '../../..');

describe('report query verification module', () => {
  // Report query verification needs sequelize's replacement step, which only exists on a CommonJS
  // path. Vitest resolves that path for itself, so it loads here however it is imported; node does
  // not, and a form it rejects stops the server booting. Load it the way node does.
  it('loads under node, not only under vitest', async () => {
    const { stdout } = await execFileAsync(
      process.execPath,
      [
        '--import',
        'tsx',
        '-e',
        `import(${JSON.stringify(UTILS_PATH)}).then(m => console.log(typeof m.verifyQuery))`,
      ],
      { cwd: PACKAGE_ROOT },
    );
    expect(stdout.trim()).toBe('function');
  }, 120000);
});
