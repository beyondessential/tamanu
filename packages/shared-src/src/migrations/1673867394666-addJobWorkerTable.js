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
    }
  });

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
  await query.sequelize.query(`DROP FUNCTION IF EXISTS job_worker_is_alive`);
  await query.dropTable(TABLE_NAME);
}
