import { Command } from 'commander';
import config from 'config';
import { JWT_TOKEN_TYPES } from '@tamanu/constants/auth';
import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';
import { buildToken } from '../../auth/utils';
import { closeDatabase, initDatabase } from '../../database';

export const genToken = async (email, { expiresIn }) => {
  // find user
  const store = await initDatabase({ testMode: false });
  const user = await store.sequelize.models.User.findOne({
    where: { email, visibilityStatus: VISIBILITY_STATUSES.CURRENT },
  });
  if (!user) {
    throw new Error('Could not find user with that email');
  }

  // generate token
  const token = await buildToken(
    {
      userId: user.id,
    },
    null,
    { expiresIn, audience: JWT_TOKEN_TYPES.ACCESS, issuer: config.canonicalHostName },
  );

  // cleanup
  if (process.env.NODE_ENV !== 'test') {
    await closeDatabase();
  }

  return token;
};

const issue = async (email, options) => {
  // issue() and genToken() are split up to make testing easier
  const token = await genToken(email, options);
  process.stderr.write(`Expires in ${options.expiresIn} (see -e option, in --help output)\n`);
  process.stdout.write(`${token}\n`);
};

export const issueCommand = new Command('issue')
  .description('Issue a new API key')
  .argument('<email>', 'Email of the user the key should authenticate as')
  .option(
    '-e, --expiresIn <expiresIn>',
    'Token expiry (see https://github.com/vercel/ms for format)',
    '3 months',
  )
  .action(issue);
