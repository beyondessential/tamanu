import { Command } from 'commander';
import { upgrade } from '@tamanu/upgrade';
import { initDatabase } from '../database';
import { VERSION } from '../middleware/versionCompatibility';

export const upgradeCommand = new Command('upgrade')
  .description('Upgrade Tamanu installation')
  .action(async () => {
    const { sequelize, models } = await initDatabase({ testMode: false });
    await upgrade({ sequelize, models, toVersion: VERSION, serverType: 'central' });
    process.exit(0);
  });
