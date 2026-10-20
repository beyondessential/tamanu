import { DataTypes, QueryInterface } from 'sequelize';

// DDL only (spec: specs/sync/sensitive-networks.md). Runs after the backfill, which reads the
// column. A facility is sensitive exactly when it belongs to a network, so there is nothing left
// for a separate flag to say.
export async function up(query: QueryInterface): Promise<void> {
  await query.removeColumn('facilities', 'is_sensitive');
}

export async function down(query: QueryInterface): Promise<void> {
  // The column comes back empty here; the backfill migration's own down restores which facilities
  // were sensitive, from their network membership.
  await query.addColumn('facilities', 'is_sensitive', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
}
