import prompts from 'prompts';

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
  console.log('No users found in database. Creating admin user...');

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

  console.log(`Successfully created user ${displayName} (${email}).`);
}
