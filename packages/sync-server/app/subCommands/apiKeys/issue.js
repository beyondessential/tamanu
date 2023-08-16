import { Command } from 'commander';
import config from 'config';
import { JWT_TOKEN_TYPES } from '@tamanu/constants/auth';
import { DEFAULT_JWT_SECRET } from '../../auth';
import { getToken } from '../../auth/utils';
import { initDatabase, closeDatabase } from '../../database';

const keyTypeToSecret = {
  default: DEFAULT_JWT_SECRET,
  omniLab: config.integrations.omniLab.secret,
};

export const genToken = async (keyType, email, { expiresIn }) => {
  // find secret
  if (keyType && !keyTypeToSecret.hasOwnProperty(keyType)) {
    throw new Error('Unknown keyType');
  }
  const secret = keyTypeToSecret[keyType];
  if (!secret) {
    throw new Error(
      'Secret not defined but keyType is known (you may need to set a secret in the config)',
    );
  }

  // find user
  const store = await initDatabase({ testMode: false });
  const user = await store.sequelize.models.User.findOne({
    where: { email },
  });
  if (!user) {
    throw new Error('Could not find user with that email');
  }

  // generate token
  const token = await getToken(
    {
      userId: user.id,
    },
    secret,
    { expiresIn, audience: JWT_TOKEN_TYPES.ACCESS, issuer: config.canonicalHostName },
  );

  // cleanup
  if (process.env.NODE_ENV !== 'test') {
    await closeDatabase();
  }

  return token;
};

const issue = async (keyType, email, options) => {
  // issue() and genToken() are split up to make testing easier
  const token = await genToken(keyType, email, options);
  process.stderr.write(`Expires in ${options.expiresIn} (see -e option, in --help output)\n`);
  process.stdout.write(`${token}\n`);
};

export const issueCommand = new Command('issue')
  .description('Issue a new API key')
  .argument(
    '<keyType>',
    `Type of API key to issue (one of ${Object.keys(keyTypeToSecret).join(',')})`,
  )
  .argument('<email>', 'Email of the user the key should authenticate as')
  .option(
    '-e, --expiresIn <expiresIn>',
    'Token expiry (see https://github.com/vercel/ms for format)',
    '3 months',
  )
  .action(issue);
