import Sequelize, { DataTypes } from 'sequelize';

const TABLE = { schema: 'fhir', tableName: 'job_workers' };

export async function up(query) {
  await query.createTable(TABLE, {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false,
    },
    deleted_at: Sequelize.DATE, // not used, but required by our models
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  });

  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.job_worker_register(
      IN worker_info JSONB,
      OUT worker_id UUID
    )
      RETURNS NULL ON NULL INPUT
      LANGUAGE SQL
      VOLATILE PARALLEL UNSAFE
    AS $$
      INSERT INTO fhir.job_workers (metadata) VALUES (worker_info)
      RETURNING id
    $$
  `);

  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.job_worker_heartbeat(
      IN worker_id UUID
    )
      RETURNS void
      LANGUAGE SQL
      VOLATILE PARALLEL UNSAFE
    AS $$
      UPDATE fhir.job_workers SET updated_at = current_timestamp WHERE id = worker_id
    $$
  `);

  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.job_worker_deregister(
      IN worker_id UUID
    )
      RETURNS void
      LANGUAGE SQL
      VOLATILE PARALLEL UNSAFE
    AS $$
      DELETE FROM fhir.job_workers WHERE id = worker_id
    $$
  `);

  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.job_worker_garbage_collect()
      RETURNS void
      LANGUAGE SQL
      VOLATILE PARALLEL UNSAFE
    AS $$
      DELETE FROM fhir.job_workers
      WHERE updated_at < current_timestamp - (setting_get('fhir.worker.assumeDroppedAfter') ->> 0)::interval
    $$
  `);

  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.job_worker_is_alive(
      IN worker_id UUID,
      OUT alive BOOLEAN
    )
      LANGUAGE SQL
      STABLE PARALLEL SAFE
    AS $$
      SELECT coalesce((
        SELECT updated_at > current_timestamp - (setting_get('fhir.worker.assumeDroppedAfter') ->> 0)::interval
        FROM fhir.job_workers
        WHERE id = worker_id
      ), false)
    $$
  `);
}

export async function down(query) {
  await query.sequelize.query('DROP FUNCTION IF EXISTS fhir.job_worker_is_alive');
  await query.sequelize.query('DROP FUNCTION IF EXISTS fhir.job_worker_garbage_collect');
  await query.sequelize.query('DROP FUNCTION IF EXISTS fhir.job_worker_deregister');
  await query.sequelize.query('DROP FUNCTION IF EXISTS fhir.job_worker_heartbeat');
  await query.sequelize.query('DROP FUNCTION IF EXISTS fhir.job_worker_register');
  await query.dropTable(TABLE);
}
