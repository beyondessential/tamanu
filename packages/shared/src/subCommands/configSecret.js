import { Command } from 'commander';
import { configSecretInitAction, configSecretEncryptAction } from '../utils/crypto';

const wrapAction = action => async () => {
  try {
    await action(process.stdout, process.stderr);
  } catch (err) {
    process.stderr.write(`Error: ${err.message}\n`);
    process.exit(1);
  }
};

/**
 * Builds the `configSecret` CLI command tree. Returned fresh each call so
 * the same command instance isn't shared across multiple commander programs.
 */
export function buildConfigSecretCommand() {
  const initCommand = new Command('init')
    .description('Generate a new key file for encrypting config secrets')
    .action(wrapAction(configSecretInitAction));

  const encryptCommand = new Command('encrypt')
    .description('Encrypt a value for use in config files')
    .action(wrapAction(configSecretEncryptAction));

  return new Command('configSecret')
    .description('Manage encrypted configuration secrets')
    .addCommand(initCommand)
    .addCommand(encryptCommand);
}
