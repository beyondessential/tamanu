import { execFileSync } from 'child_process';
import { Command } from 'commander';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import CA from '../ca';
import { validate } from '../ca/Config';
import { confirm } from '../utils';

async function run(folder: string, config?: string): Promise<void> {
  const ca = new CA(folder);
  await ca.openReadOnly();

  const configFile =
    config || join(await fs.mkdtemp(join(tmpdir(), 'csca-reconfig-')), 'config.json');

  if (!config) {
    // Write existing config to tempfile
    await fs.writeFile(configFile, await ca.exportConfig());

    // Open editor on tempfile
    const editor = process.env.EDITOR || process.env.VISUAL || 'nano';
    execFileSync(editor, [configFile], { stdio: 'inherit' });
  }

  const newConfig = JSON.parse(await fs.readFile(configFile, 'utf-8'));

  await validate(newConfig);
  console.log(newConfig);
  await confirm('Are you sure you want to reconfigure the CA?');

  await ca.openReadWrite();
  await ca.validateAndImportConfig(newConfig);

  await ca.archive();
}

export default new Command('reconfig')
  .description('update the CSCA configuration file')
  .argument('<folder>', 'path to CSCA folder')
  .argument('[config-file]', 'path to new config file (or leave out to edit with your $EDITOR)')
  .action(run);
