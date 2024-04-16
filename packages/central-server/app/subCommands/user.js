import { Command } from 'commander';
import { promisify } from 'util';
import readSync from 'read';
import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';

import { initDatabase } from '../database';

const read = promisify(readSync);

const readPassword = prompt => read({ silent: true, prompt, replace: '*' });

export const changePassword = async ({ email }) => {
  const store = await initDatabase({ testMode: false });
  const { User } = store.models;

  // check user exists
  const user = await User.findOne({
    where: { email, visibilityStatus: VISIBILITY_STATUSES.CURRENT },
  });
  if (!user) {
    throw new Error('Could not find a user with specified email');
  }

  // read password twice and ensure it matches
  const password = await readPassword('New password:');
  const passwordCheck = await readPassword('New password (again):');
  if (password !== passwordCheck) {
    throw new Error('Passwords must match');
  }

  // update and verify the update went through
  const [num] = await User.update({ password }, { where: { email } });
  if (num === 0) {
    throw new Error(
      'Found a user, but updated 0 records (another process may have modified the user)',
    );
  }
};

export const userCommand = new Command('user')
  .command('changePassword')
  .requiredOption('-e, --email <email>') // this is an option to allow e.g. --id in future
  .action(changePassword);
