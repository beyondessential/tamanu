import config from 'config';
import { get as lodashGet } from 'es-toolkit/compat';
import { QueryTypes, type Transaction } from 'sequelize';
import { SERVER_IDENTITY_FACTS } from '@tamanu/constants';
import type { Sequelize } from '@tamanu/database';
import { CONFIG_TO_SECRET_SETTINGS } from '@tamanu/settings';
import { log } from '@tamanu/shared/services/logging';
import {
  decryptSecret,
  encryptSecret,
  getConfigKeyFilePath,
  isEncryptedSecret,
  PUBLISHED_DEVELOPMENT_KEY,
  readConfigKeyFile,
} from '@tamanu/shared/utils/crypto';

const SECRET_TABLES = ['local_system_secrets', 'local_system_facts'];

const ENCRYPTED_CONFIG_PATHS = [
  'crypto.settingsPsk',
  ...CONFIG_TO_SECRET_SETTINGS.filter(entry => entry.encryptedInConfig).map(entry => entry.config),
];

type StoredSecret = { table: string; id: string; value: string };

async function findEncryptedSecrets(sequelize: Sequelize): Promise<StoredSecret[]> {
  const secrets: StoredSecret[] = [];
  for (const table of SECRET_TABLES) {
    const [exists] = await sequelize.query<{ name: string | null }>(
      `SELECT to_regclass($table) AS name`,
      { type: QueryTypes.SELECT, bind: { table: `public.${table}` } },
    );
    if (!exists?.name) continue;

    const rows = await sequelize.query<{ id: string; value: string | null }>(
      `SELECT id, value FROM public.${table} WHERE deleted_at IS NULL`,
      { type: QueryTypes.SELECT },
    );
    for (const { id, value } of rows) {
      if (isEncryptedSecret(value)) secrets.push({ table, id, value: value! });
    }
  }
  return secrets;
}

async function decrypts(keyBuffer: Buffer, encrypted: string): Promise<boolean> {
  try {
    await decryptSecret(keyBuffer, encrypted);
    return true;
  } catch {
    return false;
  }
}

async function anyDecrypts(keyBuffer: Buffer, secrets: StoredSecret[]): Promise<boolean> {
  for (const { value } of secrets) {
    if (await decrypts(keyBuffer, value)) return true;
  }
  return false;
}

async function readKey(keyFilePath: string, secrets: StoredSecret[]): Promise<Buffer> {
  try {
    return await readConfigKeyFile();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    if (await anyDecrypts(PUBLISHED_DEVELOPMENT_KEY, secrets)) {
      throw new Error(
        [
          `There is no key file at ${keyFilePath} (config crypto.keyFile), and this server's secrets are encrypted with the development key published in the Tamanu repository.`,
          'Generate a key for this server (`configSecret init` writes one to the path CRYPTO_KEY_FILE names), mount it, and set CRYPTO_KEY_FILE to its path. The upgrade then re-encrypts the secrets under it.',
        ].join('\n'),
      );
    }
    throw new Error(
      [
        `The config key file at ${keyFilePath} (config crypto.keyFile) is not present, and this server holds values encrypted with it.`,
        'Where the server runs in a container, that path is a mounted secret: check it is mounted into the process running the upgrade.',
      ].join('\n'),
    );
  }
}

// Config files can't be rewritten from here, so values in them the configured key does not read
// are named for the operator to re-encrypt.
async function checkConfigSecrets(keyBuffer: Buffer, keyFilePath: string): Promise<void> {
  const unreadable = [];
  let anyUnderDevelopmentKey = false;
  for (const path of ENCRYPTED_CONFIG_PATHS) {
    const value = lodashGet(config, path);
    if (!isEncryptedSecret(value)) continue;
    if (await decrypts(keyBuffer, value)) continue;
    unreadable.push(path);
    anyUnderDevelopmentKey ||= await decrypts(PUBLISHED_DEVELOPMENT_KEY, value);
  }
  if (unreadable.length === 0) return;

  throw new Error(
    [
      `The key file at ${keyFilePath} (config crypto.keyFile) does not decrypt these config values: ${unreadable.join(', ')}.`,
      ...(anyUnderDevelopmentKey
        ? ['Some are encrypted with the development key published in the Tamanu repository.']
        : []),
      'Re-encrypt each with `configSecret encrypt` and replace it in the config file.',
    ].join('\n'),
  );
}

// Sorts the secrets the configured key does not read by whether the published development key does.
async function findUnreadableSecrets(secrets: StoredSecret[], keyBuffer: Buffer) {
  const underDevelopmentKey: StoredSecret[] = [];
  const underUnknownKey: StoredSecret[] = [];
  for (const secret of secrets) {
    if (await decrypts(keyBuffer, secret.value)) continue;
    if (await decrypts(PUBLISHED_DEVELOPMENT_KEY, secret.value)) {
      underDevelopmentKey.push(secret);
    } else {
      underUnknownKey.push(secret);
    }
  }
  return { underDevelopmentKey, underUnknownKey };
}

// A server that ran on the published development key holds its secrets under it. Re-encrypt them
// under the configured key, in one transaction so a failure leaves them all as they were.
async function reencryptFromDevelopmentKey(
  sequelize: Sequelize,
  underDevelopmentKey: StoredSecret[],
  keyBuffer: Buffer,
  keyFilePath: string,
  parentTransaction: Transaction | null,
): Promise<void> {
  // Nested under parentTransaction during a dry run, so it rolls back with it.
  await sequelize.transaction({ transaction: parentTransaction }, async () => {
    for (const { table, id, value } of underDevelopmentKey) {
      const plaintext = await decryptSecret(PUBLISHED_DEVELOPMENT_KEY, value);
      await sequelize.query(`UPDATE public.${table} SET value = $value WHERE id = $id`, {
        bind: { id, value: await encryptSecret(keyBuffer, plaintext) },
      });
    }
  });
  const message = parentTransaction
    ? 'Dry run: would re-encrypt stored secrets from the published development key'
    : 'Re-encrypted stored secrets from the published development key';
  log.warn(message, {
    count: underDevelopmentKey.length,
    keyFile: keyFilePath,
  });
}

// The function ships in a migration, and this check runs before migrations, so a copy taken
// from an older version does not have it yet.
async function asCopyAdvice(sequelize: Sequelize): Promise<string> {
  const [row] = await sequelize.query<{ name: string | null }>(
    `SELECT to_regprocedure('public.forget_server_identity()')::text AS name`,
    { type: QueryTypes.SELECT },
  );
  const steps = row?.name
    ? "run `BEGIN; SELECT set_config('tamanu.this_is_a_copy', 'true', true); SELECT forget_server_identity(); COMMIT;` against it first."
    : [
        'first delete every row of local_system_secrets,',
        `every local_system_facts row holding an encrypted value (S1:<iv>:<ciphertext>), and the ${SERVER_IDENTITY_FACTS.join(', ')} facts,`,
        'then soft-delete every settings row holding an encrypted value.',
      ].join(' ');
  return [
    `If this is a copy, to run it under this key instead, ${steps}`,
    'Never do this on the server it was copied from: there, the key file above is the wrong one.',
  ].join('\n');
}

export async function checkConfigKey(
  sequelize: Sequelize,
  parentTransaction: Transaction | null = null,
): Promise<void> {
  const secrets = await findEncryptedSecrets(sequelize);
  const hasConfigSecrets = ENCRYPTED_CONFIG_PATHS.some(path =>
    isEncryptedSecret(lodashGet(config, path)),
  );
  if (secrets.length === 0 && !hasConfigSecrets) return;

  const keyFilePath = getConfigKeyFilePath();
  const keyBuffer = await readKey(keyFilePath, secrets);
  await checkConfigSecrets(keyBuffer, keyFilePath);

  const { underDevelopmentKey, underUnknownKey } = await findUnreadableSecrets(secrets, keyBuffer);
  if (underUnknownKey.length > 0) {
    throw new Error(
      [
        `The config key file at ${keyFilePath} (config crypto.keyFile) does not decrypt this database's secrets.`,
        "A database restored from another deployment holds that deployment's secrets, and only its key file reads them.",
        await asCopyAdvice(sequelize),
      ].join('\n'),
    );
  }

  if (underDevelopmentKey.length > 0) {
    await reencryptFromDevelopmentKey(
      sequelize,
      underDevelopmentKey,
      keyBuffer,
      keyFilePath,
      parentTransaction,
    );
  }
}
