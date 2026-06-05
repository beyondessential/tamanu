import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = { tableName: 'medication_dispenses', schema: 'public' };
const COLUMN = 'medication_preset_label_id';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn(TABLE, COLUMN, {
    type: DataTypes.STRING,
    allowNull: true,
    references: { model: 'reference_data', key: 'id' },
    onDelete: 'SET NULL',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: removes recorded preset selections from existing dispenses.
  await query.removeColumn(TABLE, COLUMN);
}
