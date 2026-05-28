import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = { tableName: 'medication_dispenses', schema: 'public' };
const COLUMN = 'medication_preset_label_id';

// Records which Medication Preset Label (a reference_data record of type
// 'medicationPresetLabel') the pharmacist picked for this dispense, if any.
// Nullable because the field is optional and only used when the deployment has
// preset labels enabled.

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
