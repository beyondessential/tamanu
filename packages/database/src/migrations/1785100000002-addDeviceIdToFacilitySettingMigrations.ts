import { DataTypes, QueryInterface } from 'sequelize';

// Server-scope (machine-level) settings ride the same carrier as facility ones,
// keyed by device instead of facility — so facility_id becomes optional.
export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('facility_setting_migrations', 'device_id', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
  // changeColumn with references regenerates the fkey but doesn't reliably
  // drop NOT NULL — do it directly.
  await query.sequelize.query(
    'ALTER TABLE facility_setting_migrations ALTER COLUMN facility_id DROP NOT NULL',
  );
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: any device-keyed carrier rows (facility_id null) violate the
  // restored NOT NULL — remove them by hand before rolling back.
  await query.removeColumn('facility_setting_migrations', 'device_id');
  await query.sequelize.query(
    'ALTER TABLE facility_setting_migrations ALTER COLUMN facility_id SET NOT NULL',
  );
}
