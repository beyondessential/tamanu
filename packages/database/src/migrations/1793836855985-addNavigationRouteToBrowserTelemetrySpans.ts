import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = { tableName: 'browser_telemetry_spans', schema: 'logs' };

// spec: BTEL
// The route pattern of the navigation a request was made under, stamped by the
// browser. The aggregation (spec: BTAG) reads it to tell apart an endpoint that
// is only slow on one page, without waiting on the navigation span, which
// reaches the server after its requests.
export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn(TABLE, 'navigation_route', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn(TABLE, 'navigation_route');
}
