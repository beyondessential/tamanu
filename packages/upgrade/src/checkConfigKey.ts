import config from 'config';
import { get as lodashGet } from 'es-toolkit/compat';
import { QueryTypes, type Transaction } from 'sequelize';
import { FACT_SETTINGS_PSK, SERVER_IDENTITY_FACTS } from '@tamanu/constants';
import type { Sequelize } from '@tamanu/database';
import { CONFIG_TO_SECRET_SETTINGS } from '@tamanu/settings';
import { log } from '@tamanu/shared/services/logging';
import {
  decryptSecret,
  encryptSecret,
  getConfigKeyFilePath,
  isEncryptedSecret,
  PROVIDE_KEY_ADVICE,
  PUBLISHED_DEVELOPMENT_KEY,
  readConfigKeyFile,
} from '@tamanu/shared/utils/crypto';

const SECRET_TABLES = ['local_system_secrets', 'local_system_facts'];

const SETTINGS_PSK_CONFIG_PATH = 'crypto.settingsPsk';

const ENCRYPTED_CONFIG_SECRET_SETTINGS = CONFIG_TO_SECRET_SETTINGS.filter(
  entry => entry.encryptedInConfig,
);

const ENCRYPTED_CONFIG_PATHS = [
  SETTINGS_PSK_CONFIG_PATH,
  ...ENCRYPTED_CONFIG_SECRET_SETTINGS.map(entry => entry.config),
];

type StoredSecret = { table: string; id: string; key: string; value: string; deleted: boolean };

// Deleted rows are included: one still under the published development key is readable by anyone
// holding the database, so it is re-encrypted with the rest.
// This check runs before migrations, so on a fresh database none of the tables it reads exist yet.
async function tableExists(sequelize: Sequelize, table: string): Promise<boolean> {
  const [row] = await sequelize.query<{ name: string | null }>(
    `SELECT to_regclass($table) AS name`,
    { type: QueryTypes.SELECT, bind: { table: `public.${table}` } },
  );
  return Boolean(row?.name);
}

async function findEncryptedSecrets(sequelize: Sequelize): Promise<StoredSecret[]> {
  const secrets: StoredSecret[] = [];
  for (const table of SECRET_TABLES) {
    if (!(await tableExists(sequelize, table))) continue;

    const rows = await sequelize.query<{
      id: string;
      key: string;
      value: string | null;
      deleted: boolean;
    }>(`SELECT id, key, value, deleted_at IS NOT NULL AS deleted FROM public.${table}`, {
      type: QueryTypes.SELECT,
    });
    for (const { id, key, value, deleted } of rows) {
      if (isEncryptedSecret(value)) secrets.push({ table, id, key, value: value!, deleted });
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

async function anyDecrypts(keyBuffer: Buffer, encryptedValues: string[]): Promise<boolean> {
  for (const value of encryptedValues) {
    if (await decrypts(keyBuffer, value)) return true;
  }
  return false;
}

// Encrypted config values the server still reads. The settings PSK is read from config only until
// the local store holds it, and a secret setting only until it is set, so a value either of those
// has replaced is reported as unused rather than checked.
async function findConfigSecrets(
  sequelize: Sequelize,
  secrets: StoredSecret[],
): Promise<{ inUse: { path: string; value: string }[]; unused: string[] }> {
  const superseded = new Set<string>();
  if (
    secrets.some(({ table, key }) => table === 'local_system_secrets' && key === FACT_SETTINGS_PSK)
  ) {
    superseded.add(SETTINGS_PSK_CONFIG_PATH);
  }
  if (await tableExists(sequelize, 'settings')) {
    for (const entry of ENCRYPTED_CONFIG_SECRET_SETTINGS) {
      const rows = await sequelize.query(
        `SELECT 1 FROM public.settings
          WHERE deleted_at IS NULL AND key = $key AND scope = $scope
          LIMIT 1`,
        { type: QueryTypes.SELECT, bind: { key: entry.setting, scope: entry.scope } },
      );
      if (rows.length > 0) superseded.add(entry.config);
    }
  }

  const inUse = [];
  const unused = [];
  for (const path of ENCRYPTED_CONFIG_PATHS) {
    const value = lodashGet(config, path);
    if (!isEncryptedSecret(value)) continue;
    if (superseded.has(path)) {
      unused.push(path);
    } else {
      inUse.push({ path, value });
    }
  }
  return { inUse, unused };
}

async function readKey(keyFilePath: string, encryptedValues: string[]): Promise<Buffer> {
  try {
    return await readConfigKeyFile();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    if (await anyDecrypts(PUBLISHED_DEVELOPMENT_KEY, encryptedValues)) {
      throw new Error(
        [
          `There is no key file at ${keyFilePath} (config crypto.keyFile), and this server's secrets are encrypted with the development key published in the Tamanu repository.`,
          PROVIDE_KEY_ADVICE,
          'The upgrade then re-encrypts the stored secrets under it, and names any config values to re-encrypt.',
        ].join('\n'),
        { cause: err },
      );
    }
    throw new Error(
      [
        `The config key file at ${keyFilePath} (config crypto.keyFile) is not present, and this server's database or config holds values encrypted with it.`,
        'Where the server runs in a container, that path is a mounted secret: check it is mounted into the process running the upgrade.',
      ].join('\n'),
      { cause: err },
    );
  }
}

// Config files can't be rewritten from here, so values in them the configured key does not read
// are named for the operator to re-encrypt.
async function checkConfigSecrets(
  configSecrets: { path: string; value: string }[],
  keyBuffer: Buffer,
  keyFilePath: string,
): Promise<void> {
  const unreadable = [];
  let anyUnderDevelopmentKey = false;
  for (const { path, value } of configSecrets) {
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
// A deleted row under some other key is nothing the server reads, so it is left alone.
async function findUnreadableSecrets(secrets: StoredSecret[], keyBuffer: Buffer) {
  const underDevelopmentKey: StoredSecret[] = [];
  const underUnknownKey: StoredSecret[] = [];
  for (const secret of secrets) {
    if (await decrypts(keyBuffer, secret.value)) continue;
    if (await decrypts(PUBLISHED_DEVELOPMENT_KEY, secret.value)) {
      underDevelopmentKey.push(secret);
    } else if (!secret.deleted) {
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
  // A copy restored from a server on the development key reads as that server moving off it, so
  // the copy is only caught by whoever restored it.
  log.warn(
    `If this database was restored from another server, it now holds that server's identity and credentials: before starting it, ${await forgetIdentitySteps(sequelize)}.`,
  );
}

// The function ships in a migration, and this check runs before migrations, so a copy taken
// from an older version does not have it yet.
async function forgetIdentitySteps(sequelize: Sequelize): Promise<string> {
  const [row] = await sequelize.query<{ name: string | null }>(
    `SELECT to_regprocedure('public.forget_server_identity()')::text AS name`,
    { type: QueryTypes.SELECT },
  );
  return row?.name
    ? "run `BEGIN; SELECT set_config('tamanu.this_is_a_copy', 'true', true); SELECT forget_server_identity(); COMMIT;` against it"
    : [
        'delete every row of local_system_secrets,',
        `every local_system_facts row holding an encrypted value (S1:<iv>:<ciphertext>), and the ${SERVER_IDENTITY_FACTS.join(', ')} facts,`,
        'then soft-delete every settings row holding an encrypted value',
      ].join(' ');
}

async function asCopyAdvice(sequelize: Sequelize): Promise<string> {
  return [
    `If this is a copy, to run it under this key instead, first ${await forgetIdentitySteps(sequelize)}.`,
    'Never do this on the server it was copied from: there, the key file above is the wrong one.',
  ].join('\n');
}

export async function checkConfigKey(
  sequelize: Sequelize,
  parentTransaction: Transaction | null = null,
): Promise<void> {
  const secrets = await findEncryptedSecrets(sequelize);
  const liveSecrets = secrets.filter(({ deleted }) => !deleted);
  const configSecrets = await findConfigSecrets(sequelize, liveSecrets);
  if (configSecrets.unused.length > 0) {
    log.warn(
      'Encrypted config values are unused, since what they held is now stored elsewhere; remove them from the config file',
      {
        paths: configSecrets.unused.join(', '),
      },
    );
  }
  if (secrets.length === 0 && configSecrets.inUse.length === 0) return;

  const keyFilePath = getConfigKeyFilePath();
  const keyBuffer = await readKey(keyFilePath, [
    ...liveSecrets.map(({ value }) => value),
    ...configSecrets.inUse.map(({ value }) => value),
  ]);
  await checkConfigSecrets(configSecrets.inUse, keyBuffer, keyFilePath);

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
