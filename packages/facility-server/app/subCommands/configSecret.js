import { Command } from 'commander';
import { promisify } from 'util';
import readSync from 'read';
import {
  initConfigSecretKeyFile,
  encryptConfigValue,
  encryptSecret,
  readKeyFile,
} from '@tamanu/shared/utils/crypto';

const read = promisify(readSync);

const initAction = async () => {
  try {
    const keyFilePath = await initConfigSecretKeyFile();
    process.stderr.write(`Successfully created key file at: ${keyFilePath}\n`);
    process.stderr.write('Keep this file secure and back it up safely.\n');
    process.stderr.write('You will need it to decrypt any secrets encrypted with it.\n\n');

    // Prompt for settings PSK
    const settingsPsk = await read({
      prompt: 'Enter settings PSK (leave empty to skip): ',
      silent: true,
      replace: '*',
    });

    let settingsPskLine = '';
    if (settingsPsk) {
      const keyBuffer = await readKeyFile(keyFilePath);
      const encryptedPsk = await encryptSecret(keyBuffer, settingsPsk);
      settingsPskLine = `\n  settingsPsk: "${encryptedPsk}",`;
    }

    process.stderr.write('\nAdd this to your config file:\n\n');
    process.stdout.write(`crypto: {\n  keyFile: "${keyFilePath}",${settingsPskLine}\n},\n`);
  } catch (err) {
    process.stderr.write(`Error: ${err.message}\n`);
    process.exit(1);
  }
};

const encryptAction = async () => {
  try {
    const value = await read({
      prompt: 'Enter value to encrypt: ',
      silent: true,
      replace: '*',
    });

    if (!value) {
      process.stderr.write('Error: No value provided\n');
      process.exit(1);
    }

    const encrypted = await encryptConfigValue(value);
    process.stderr.write('Encrypted value (copy this to your config):\n');
    process.stdout.write(`${encrypted}\n`);
  } catch (err) {
    process.stderr.write(`Error: ${err.message}\n`);
    process.exit(1);
  }
};

const initCommand = new Command('init')
  .description('Generate a new key file for encrypting config secrets')
  .action(initAction);

const encryptCommand = new Command('encrypt')
  .description('Encrypt a value for use in config files')
  .action(encryptAction);

export const configSecretCommand = new Command('configSecret').description(
  'Manage encrypted configuration secrets',
);

configSecretCommand.addCommand(initCommand);
configSecretCommand.addCommand(encryptCommand);
