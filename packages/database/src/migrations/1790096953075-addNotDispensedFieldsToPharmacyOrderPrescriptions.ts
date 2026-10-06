import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = 'pharmacy_order_prescriptions';

// Records why and when a medication request was marked as not dispensed. The request is soft
// deleted at the same time (same mechanism as the existing delete action) so it drops off the
// active list, while these columns retain the clinical detail needed to answer a click-through
// from the prescriber's notification after the row is gone from the active view.
export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn(TABLE, 'not_dispensed_reason_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: { model: 'reference_data', key: 'id' },
  });
  await query.addColumn(TABLE, 'not_dispensed_by_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  });
  await query.addColumn(TABLE, 'not_dispensed_at', {
    type: DataTypes.DATETIMESTRING,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn(TABLE, 'not_dispensed_at');
  await query.removeColumn(TABLE, 'not_dispensed_by_id');
  await query.removeColumn(TABLE, 'not_dispensed_reason_id');
}
