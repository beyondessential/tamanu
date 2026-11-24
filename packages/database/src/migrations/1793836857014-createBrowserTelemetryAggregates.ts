import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

// spec: BTAG
// Long-lived aggregates rolled up from the raw browser telemetry spans: one
// trend row per page or endpoint per time bucket, the slowest individual events
// behind each, and the requests made while a slow navigation was loading. They
// push to central and are kept indefinitely, unlike the raw spans.
//
// Ids are deterministic (derived from what each row describes), so rolling a
// bucket up again replaces its rows rather than duplicating them, including on
// central after a facility is restored from a backup.

const timestamps = {
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.fn('now'),
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.fn('now'),
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
};

// A fresh definition per column: Sequelize mutates attribute definitions, so
// one object shared between columns would map them all to the same field.
const count = () => ({ type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 });

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable('browser_telemetry_trends', {
    id: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
    ...timestamps,
    bucket_start: { type: DataTypes.DATE, allowNull: false },
    bucket_minutes: { type: DataTypes.INTEGER, allowNull: false },
    interface: { type: DataTypes.TEXT, allowNull: false },
    facility_id: { type: DataTypes.TEXT, allowNull: true },
    kind: { type: DataTypes.TEXT, allowNull: false },
    route: { type: DataTypes.TEXT, allowNull: false },
    method: { type: DataTypes.TEXT, allowNull: true },
    app_version: { type: DataTypes.TEXT, allowNull: false },
    event_count: count(),
    successful_count: count(),
    client_error_count: count(),
    server_error_count: count(),
    no_response_count: count(),
    cut_off_count: count(),
    settled_count: count(),
    capped_count: count(),
    abandoned_count: count(),
    timed_count: count(),
    total_duration_ms: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    duration_histogram: { type: DataTypes.ARRAY(DataTypes.INTEGER), allowNull: false },
    p50_duration_ms: { type: DataTypes.INTEGER, allowNull: true },
    p95_duration_ms: { type: DataTypes.INTEGER, allowNull: true },
    p99_duration_ms: { type: DataTypes.INTEGER, allowNull: true },
    max_duration_ms: { type: DataTypes.INTEGER, allowNull: true },
  });
  await query.addIndex('browser_telemetry_trends', ['bucket_start'], {
    name: 'browser_telemetry_trends_bucket_start',
  });
  await query.addIndex('browser_telemetry_trends', ['route', 'bucket_start'], {
    name: 'browser_telemetry_trends_route_bucket_start',
  });

  await query.createTable('browser_telemetry_slow_events', {
    id: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
    ...timestamps,
    trend_id: { type: DataTypes.STRING, allowNull: false },
    trace_id: { type: DataTypes.TEXT, allowNull: false },
    span_id: { type: DataTypes.TEXT, allowNull: false },
    kind: { type: DataTypes.TEXT, allowNull: false },
    route: { type: DataTypes.TEXT, allowNull: false },
    navigation_route: { type: DataTypes.TEXT, allowNull: true },
    method: { type: DataTypes.TEXT, allowNull: true },
    status_code: { type: DataTypes.INTEGER, allowNull: true },
    outcome: { type: DataTypes.TEXT, allowNull: true },
    duration_ms: { type: DataTypes.INTEGER, allowNull: false },
    occurred_at: { type: DataTypes.DATE, allowNull: false },
    received_at: { type: DataTypes.DATE, allowNull: false },
    interface: { type: DataTypes.TEXT, allowNull: false },
    facility_id: { type: DataTypes.TEXT, allowNull: true },
    app_version: { type: DataTypes.TEXT, allowNull: false },
    device_id: { type: DataTypes.TEXT, allowNull: false },
    user_id: { type: DataTypes.TEXT, allowNull: true },
    path_parameters: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    query_parameter_names: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
    },
  });
  await query.addIndex('browser_telemetry_slow_events', ['trend_id'], {
    name: 'browser_telemetry_slow_events_trend_id',
  });

  await query.createTable('browser_telemetry_slow_event_requests', {
    id: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
    ...timestamps,
    slow_event_id: { type: DataTypes.STRING, allowNull: false },
    span_id: { type: DataTypes.TEXT, allowNull: false },
    route: { type: DataTypes.TEXT, allowNull: false },
    method: { type: DataTypes.TEXT, allowNull: true },
    status_code: { type: DataTypes.INTEGER, allowNull: true },
    outcome: { type: DataTypes.TEXT, allowNull: true },
    duration_ms: { type: DataTypes.INTEGER, allowNull: false },
    start_offset_ms: { type: DataTypes.INTEGER, allowNull: false },
    path_parameters: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    query_parameter_names: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
    },
  });
  await query.addIndex('browser_telemetry_slow_event_requests', ['slow_event_id'], {
    name: 'browser_telemetry_slow_event_requests_slow_event_id',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable('browser_telemetry_slow_event_requests');
  await query.dropTable('browser_telemetry_slow_events');
  await query.dropTable('browser_telemetry_trends');
}
