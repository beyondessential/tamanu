import prompts from 'prompts';
import shortid from 'shortid';
import { hash } from 'bcrypt';
import { auth } from 'config';

const { saltRounds } = auth;

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

export async function createInitialAdmin(db) {
  console.log("No users found in database. Creating admin user...");

  const response = (['development', 'test'].includes(process.env.NODE_ENV))
    ? await getDetailsAutomatic()
    : await getDetailsInteractive();

  const { displayName, email, password } = response;
  if(!(displayName && email && password)) {
    throw new Error("Could not create admin user - invalid details provided.");
  }

  const hashedPassword = await hash(password, saltRounds);

  db.write(() => {
    db.create('user', {
      _id: shortid.generate(),
      displayName, 
      email,
      password: hashedPassword,
    });
  });

  console.log(`Successfully created user ${displayName} (${email}).`);
}
