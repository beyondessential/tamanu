import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = 'medication_dispenses';

// Expand medication_dispenses to explicitly state what was dispensed. The clinical columns are
// populated on every dispense — copied from the prescription by default, or with pharmacy's
// modified values when the prescription is modified at dispensing. The original prescription is
// never altered; each fill is a self-contained record of what was actually dispensed.
// modified_at (with modified_by_id / modified_reason_id) is only set when pharmacy modified the
// prescription for that fill — non-null marks the dispense as modified.
export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn(TABLE, 'medication_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: { model: 'reference_data', key: 'id' },
  });
  await query.addColumn(TABLE, 'is_variable_dose', {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  });
  await query.addColumn(TABLE, 'dose_amount', {
    type: DataTypes.DECIMAL,
    allowNull: true,
  });
  await query.addColumn(TABLE, 'dosing_unit', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await query.addColumn(TABLE, 'dispensing_unit', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await query.addColumn(TABLE, 'frequency', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await query.addColumn(TABLE, 'route', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await query.addColumn(TABLE, 'duration_value', {
    type: DataTypes.DECIMAL,
    allowNull: true,
  });
  await query.addColumn(TABLE, 'duration_unit', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await query.addColumn(TABLE, 'pharmacy_notes', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await query.addColumn(TABLE, 'display_pharmacy_notes_in_mar', {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  });
  await query.addColumn(TABLE, 'modified_by_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  });
  await query.addColumn(TABLE, 'modified_reason_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: { model: 'reference_data', key: 'id' },
  });
  await query.addColumn(TABLE, 'modified_at', {
    type: DataTypes.DATETIMESTRING,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn(TABLE, 'modified_at');
  await query.removeColumn(TABLE, 'modified_reason_id');
  await query.removeColumn(TABLE, 'modified_by_id');
  await query.removeColumn(TABLE, 'display_pharmacy_notes_in_mar');
  await query.removeColumn(TABLE, 'pharmacy_notes');
  await query.removeColumn(TABLE, 'duration_unit');
  await query.removeColumn(TABLE, 'duration_value');
  await query.removeColumn(TABLE, 'route');
  await query.removeColumn(TABLE, 'frequency');
  await query.removeColumn(TABLE, 'dispensing_unit');
  await query.removeColumn(TABLE, 'dosing_unit');
  await query.removeColumn(TABLE, 'dose_amount');
  await query.removeColumn(TABLE, 'is_variable_dose');
  await query.removeColumn(TABLE, 'medication_id');
}
