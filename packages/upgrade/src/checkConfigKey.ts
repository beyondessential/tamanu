import { QueryTypes } from 'sequelize';
import type { Sequelize } from '@tamanu/database';
import { getConfigKeyFilePath, isEncryptedSecret, readKeyFile } from '@tamanu/shared/utils/crypto';

const SECRET_TABLES = ['local_system_secrets', 'local_system_facts'];

async function hasEncryptedSecrets(sequelize: Sequelize): Promise<boolean> {
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
    if (rows.some(({ value }) => isEncryptedSecret(value))) return true;
  }
  return false;
}

export async function checkConfigKey(sequelize: Sequelize): Promise<void> {
  if (!(await hasEncryptedSecrets(sequelize))) return;

  const keyFilePath = getConfigKeyFilePath();
  try {
    await readKeyFile(keyFilePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    throw new Error(
      [
        `The config key file at ${keyFilePath} (config crypto.keyFile) is not present, and this database holds values encrypted with it.`,
        'Where the server runs in a container, that path is a mounted secret: check it is mounted into the process running the upgrade.',
      ].join('\n'),
    );
  }
}
