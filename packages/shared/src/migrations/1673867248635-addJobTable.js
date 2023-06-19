import Sequelize, { DataTypes } from 'sequelize';

const TABLE = { schema: 'fhir', tableName: 'jobs' };

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

    // queue
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1000,
    },
    status: {
      type: DataTypes.TEXT,
      defaultValue: 'Queued',
      allowNull: false,
    },
    worker_id: DataTypes.UUID,
    started_at: DataTypes.DATE,
    completed_at: DataTypes.DATE,
    errored_at: DataTypes.DATE,
    error: DataTypes.TEXT,

    // routing
    topic: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    discriminant: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
      unique: true,
    },

    // data
    payload: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  });

  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.jobs_notify()
      RETURNS TRIGGER
      LANGUAGE PLPGSQL
    AS $$
    BEGIN
      -- avoid ever hitting the queue limit (and failing)
      IF pg_notification_queue_usage() < 0.5 THEN
        NOTIFY jobs;
      END IF;
      RETURN NEW;
    END;
    $$
  `);

  await query.sequelize.query(`
    CREATE TRIGGER fhir_jobs_insert_trigger
    AFTER INSERT ON fhir.jobs FOR EACH STATEMENT
    EXECUTE FUNCTION fhir.jobs_notify()
  `);
}

export async function down(query) {
  await query.sequelize.query('DROP TRIGGER fhir_jobs_insert_trigger ON fhir.jobs');
  await query.sequelize.query('DROP FUNCTION fhir.jobs_notify()');
  await query.dropTable(TABLE);
}
