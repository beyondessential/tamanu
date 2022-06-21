import { Command } from 'commander';

import { removeDuplicatedPatientAdditionalData } from '../utils/removeDuplicatedPatientAdditionalData';
import { initDatabase } from '../database';

async function runRemoverCommand() {
  const store = await initDatabase({ testMode: false });
  await removeDuplicatedPatientAdditionalData(store.sequelize);
  process.exit(0);
}

export const removeDuplicatedPatientAdditionalDataCommand = new Command(
  'removeDuplicatedPatientAdditionalData',
)
  .description('Remove duplicated PatientAdditionalData records (intended to fix a specific bug)')
  .action(runRemoverCommand);
