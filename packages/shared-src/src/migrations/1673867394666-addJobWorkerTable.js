import Sequelize, { DataTypes } from 'sequelize';

const TABLE_NAME = 'job_workers';

export async function up(query) {
  await query.createTable(TABLE_NAME, {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('current_timestamp', 3),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('current_timestamp', 3),
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  });

  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION job_worker_register(
      IN worker_info JSONB,
      OUT worker_id UUID
    )
      RETURNS NULL ON NULL INPUT
      LANGUAGE SQL
      VOLATILE PARALLEL UNSAFE
    AS $$
      INSERT INTO job_workers (metadata) VALUES (worker_info)
      RETURNING id
    $$
  `);

  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION job_worker_heartbeat(
      IN worker_id UUID
    )
      RETURNS NULL ON NULL INPUT
      LANGUAGE SQL
      VOLATILE PARALLEL UNSAFE
    AS $$
      UPDATE job_workers SET updated_at = current_timestamp(3) WHERE id = worker_id
    $$
  `);

  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION job_worker_deregister(
      IN worker_id UUID
    )
      RETURNS NULL ON NULL INPUT
      LANGUAGE SQL
      VOLATILE PARALLEL UNSAFE
    AS $$
      DELETE FROM job_workers WHERE id = worker_id
    $$
  `);

  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION job_worker_garbage_collect()
      LANGUAGE SQL
      VOLATILE PARALLEL UNSAFE
    AS $$
      DELETE FROM job_workers
      WHERE updated_at < current_timestamp() - (setting_get('jobs.worker.assumeDroppedAfter') ->> 0)::interval
    $$
  `);

  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION job_worker_is_alive(
      IN worker_id UUID,
      OUT alive BOOLEAN
    )
      RETURNS NULL ON NULL INPUT
      LANGUAGE SQL
      STABLE PARALLEL SAFE
    AS $$
      SELECT updated_at > current_timestamp() - (setting_get('jobs.worker.assumeDroppedAfter') ->> 0)::interval
      FROM job_workers
      WHERE id = worker_id
    $$
  `);
}

export async function down(query) {
  await query.sequelize.query('DROP FUNCTION IF EXISTS job_worker_is_alive');
  await query.sequelize.query('DROP FUNCTION IF EXISTS job_worker_garbage_collect');
  await query.sequelize.query('DROP FUNCTION IF EXISTS job_worker_deregister');
  await query.sequelize.query('DROP FUNCTION IF EXISTS job_worker_heartbeat');
  await query.sequelize.query('DROP FUNCTION IF EXISTS job_worker_register');
  await query.dropTable(TABLE_NAME);
}
