import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = { tableName: 'browser_telemetry_spans', schema: 'logs' };

// spec: BTEL
// Raw browser performance telemetry: one row per span (a navigation or an API
// request made during it). DO_NOT_SYNC and in the `logs` schema (so excluded
// from the changelog). High-volume and local to the facility; a scheduled task
// prunes rows past the retention horizon.
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
    trace_id: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    span_id: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    parent_id: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    kind: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    route: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    parameters: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    method: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status_code: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    duration_ms: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    outcome: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    interface: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    device_id: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    session_id: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    app_version: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    facility_id: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    occurred_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  // Retention prune scans by age.
  await query.addIndex(TABLE, ['occurred_at'], {
    name: 'browser_telemetry_spans_occurred_at',
  });
  // Downstream aggregation groups by page.
  await query.addIndex(TABLE, ['route'], {
    name: 'browser_telemetry_spans_route',
  });
  // Drill from a navigation to its request spans.
  await query.addIndex(TABLE, ['trace_id'], {
    name: 'browser_telemetry_spans_trace_id',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable(TABLE);
}
