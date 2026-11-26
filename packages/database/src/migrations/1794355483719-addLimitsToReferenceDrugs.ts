import { DataTypes, QueryInterface } from 'sequelize';

// spec: DQLIM#configuring-limits
// The new columns start empty, so existing rows and the sync lookup table need no backfill.
export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('reference_drugs', 'dose_min', {
    type: DataTypes.DECIMAL,
    allowNull: true,
  });
  await query.addColumn('reference_drugs', 'dose_max', {
    type: DataTypes.DECIMAL,
    allowNull: true,
  });
  await query.addColumn('reference_drugs', 'dispensing_quantity_min', {
    type: DataTypes.INTEGER,
    allowNull: true,
  });
  await query.addColumn('reference_drugs', 'dispensing_quantity_max', {
    type: DataTypes.INTEGER,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: any dose and dispensing quantity limits configured on drugs are lost
  await query.removeColumn('reference_drugs', 'dispensing_quantity_max');
  await query.removeColumn('reference_drugs', 'dispensing_quantity_min');
  await query.removeColumn('reference_drugs', 'dose_max');
  await query.removeColumn('reference_drugs', 'dose_min');
}
