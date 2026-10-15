import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = { tableName: 'sync_facility_runs', schema: 'public' };

// spec: SYNRUN
// One row per facility sync attempt, so a sync that hangs or never completes is
// visible to alerting. DO_NOT_SYNC operational state; ships on both central and
// facility, but only the facility sync manager writes to it.
export async function up(query: QueryInterface): Promise<void> {
  await query.createTable(TABLE, {
    id: {
      type: DataTypes.STRING,
      defaultValue: query.sequelize.literal('gen_random_uuid()'),
      allowNull: false,
      primaryKey: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: query.sequelize.literal('CURRENT_TIMESTAMP(3)'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: query.sequelize.literal('CURRENT_TIMESTAMP(3)'),
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    // Bracket the save of pulled changes into the local database, so a run stuck
    // while persisting can be told apart from one stuck talking to central.
    persist_started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    persist_completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Central's session id, once one has been issued; null if the run failed or
    // was queued before a session started.
    session_id: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    trigger_type: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    urgent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });

  // Alerting reads the latest runs, and the latest run of each status.
  await query.addIndex(TABLE, ['start_time'], {
    name: 'sync_facility_runs_start_time',
  });
  await query.addIndex(TABLE, ['status', 'start_time'], {
    name: 'sync_facility_runs_status_start_time',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable(TABLE);
}
