import { describe, it, afterAll } from 'vitest';
import { initDatabase, closeDatabase } from '../utilities';

describe('[DIAG] SequelizeMeta state after saveChangesForModel', () => {
  let sequelize: any;

  afterAll(async () => {
    await closeDatabase();
  });

  it('dumps SequelizeMeta and schema state', async () => {
    const database = await initDatabase();
    sequelize = database.sequelize;

    const [metaCount]: any = await sequelize.query(
      'SELECT count(*)::int AS cnt FROM "SequelizeMeta"',
    );
    console.log('[DIAG-EARLY] SequelizeMeta count:', metaCount[0]?.cnt);

    const [metaSample]: any = await sequelize.query(
      'SELECT name FROM "SequelizeMeta" ORDER BY name LIMIT 5',
    );
    console.log(
      '[DIAG-EARLY] first 5 entries:',
      JSON.stringify(metaSample.map((r: any) => r.name)),
    );

    const [metaTail]: any = await sequelize.query(
      'SELECT name FROM "SequelizeMeta" ORDER BY name DESC LIMIT 3',
    );
    console.log(
      '[DIAG-EARLY] last 3 entries:',
      JSON.stringify(metaTail.map((r: any) => r.name)),
    );

    const [schemaCheck]: any = await sequelize.query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'users'
      ) AS schema_exists`,
    );
    console.log('[DIAG-EARLY] users table exists:', schemaCheck[0]?.schema_exists);

    const [idleTx]: any = await sequelize.query(
      `SELECT count(*)::int AS cnt FROM pg_stat_activity
       WHERE datname = current_database() AND state = 'idle in transaction'`,
    );
    console.log('[DIAG-EARLY] idle-in-transaction connections:', idleTx[0]?.cnt);

    const [allActivity]: any = await sequelize.query(
      `SELECT state, count(*)::int AS cnt FROM pg_stat_activity
       WHERE datname = current_database() GROUP BY state ORDER BY state`,
    );
    console.log('[DIAG-EARLY] pg_stat_activity:', JSON.stringify(allActivity));
  });
});
