import { Command } from 'commander';
import { configSecretInitAction, configSecretEncryptAction } from '@tamanu/shared/utils/crypto';

const initCommand = new Command('init')
  .description('Generate a new key file for encrypting config secrets')
  .action(async () => {
    try {
      await configSecretInitAction(process.stdout, process.stderr);
    } catch (err) {
      process.stderr.write(`Error: ${err.message}\n`);
      process.exit(1);
    }
  });

const encryptCommand = new Command('encrypt')
  .description('Encrypt a value for use in config files')
  .action(async () => {
    try {
      await configSecretEncryptAction(process.stdout, process.stderr);
    } catch (err) {
      process.stderr.write(`Error: ${err.message}\n`);
      process.exit(1);
    }
  });

export const configSecretCommand = new Command('configSecret').description(
  'Manage encrypted configuration secrets',
);

configSecretCommand.addCommand(initCommand);
configSecretCommand.addCommand(encryptCommand);
