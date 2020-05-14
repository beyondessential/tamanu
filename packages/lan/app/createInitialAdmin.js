import prompts from 'prompts';
import { log } from '~/logging';

function getDetailsInteractive() {
  return prompts([
    {
      name: 'displayName',
      type: 'text',
      message: 'Display name:',
    },
    {
      name: 'email',
      type: 'text',
      message: 'Email:',
    },
    {
      name: 'password',
      type: 'text',
      style: 'invisible',
      message: 'Password:',
    },
  ]);
}

function getDetailsAutomatic() {
  return {
    displayName: 'Admin',
    email: 'admin@xyz.com',
    password: '123455',
  };
}

export async function createInitialAdmin(userModel) {
  log.info('No users found in database. Creating admin user...');

  const response = ['development', 'test'].includes(process.env.NODE_ENV)
    ? await getDetailsAutomatic()
    : await getDetailsInteractive();

  const { displayName, email, password } = response;
  if (!(displayName && email && password)) {
    throw new Error('Could not create admin user - invalid details provided.');
  }

  const user = await userModel.create({
    displayName,
    name: displayName,
    email,
    password,
    role: 'admin',
  });

  log.info(`Successfully created user ${user.displayName} (${user.email}).`);
}
