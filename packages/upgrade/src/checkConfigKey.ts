import { QueryTypes } from 'sequelize';
import { SERVER_IDENTITY_FACTS } from '@tamanu/constants';
import type { Sequelize } from '@tamanu/database';
import {
  decryptSecret,
  getConfigKeyFilePath,
  isEncryptedSecret,
  readKeyFile,
} from '@tamanu/shared/utils/crypto';

const SECRET_TABLES = ['local_system_secrets', 'local_system_facts'];

async function findEncryptedSecret(sequelize: Sequelize): Promise<string | null> {
  for (const table of SECRET_TABLES) {
    const [exists] = await sequelize.query<{ name: string | null }>(
      `SELECT to_regclass($table) AS name`,
      { type: QueryTypes.SELECT, bind: { table: `public.${table}` } },
    );
    if (!exists?.name) continue;

    const rows = await sequelize.query<{ value: string | null }>(
      `SELECT value FROM public.${table} WHERE deleted_at IS NULL`,
      { type: QueryTypes.SELECT },
    );
    const encrypted = rows.find(({ value }) => isEncryptedSecret(value));
    if (encrypted?.value) return encrypted.value;
  }
  return null;
}

// The function ships in a migration, and this check runs before migrations, so a copy taken
// from an older version does not have it yet.
async function adoptAsCopyAdvice(sequelize: Sequelize): Promise<string> {
  const [row] = await sequelize.query<{ name: string | null }>(
    `SELECT to_regprocedure('public.forget_server_identity()')::text AS name`,
    { type: QueryTypes.SELECT },
  );
  if (row?.name) {
    return 'To run it as a copy under this key instead, run `SELECT forget_server_identity();` and then `DELETE FROM local_system_secrets;` against it first.';
  }
  return [
    'To run it as a copy under this key instead, first delete every row of local_system_secrets,',
    `every local_system_facts row holding an encrypted value, and the ${SERVER_IDENTITY_FACTS.join(', ')} facts.`,
  ].join(' ');
}

export async function checkConfigKey(sequelize: Sequelize): Promise<void> {
  const encrypted = await findEncryptedSecret(sequelize);
  if (!encrypted) return;

  const keyFilePath = getConfigKeyFilePath();
  let keyBuffer;
  try {
    keyBuffer = await readKeyFile(keyFilePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    throw new Error(
      [
        `The config key file at ${keyFilePath} (config crypto.keyFile) is not present, and this database holds values encrypted with it.`,
        'Where the server runs in a container, that path is a mounted secret: check it is mounted into the process running the upgrade.',
      ].join('\n'),
    );
  }

  try {
    await decryptSecret(keyBuffer, encrypted);
  } catch {
    throw new Error(
      [
        `The config key file at ${keyFilePath} (config crypto.keyFile) does not decrypt this database's secrets.`,
        "A database restored from another deployment holds that deployment's secrets, and only its key file reads them.",
        await adoptAsCopyAdvice(sequelize),
      ].join('\n'),
    );
  }
}
