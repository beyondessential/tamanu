import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface) {
  await query.addColumn('prescriptions', 'is_ongoing', {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  });

  await query.addColumn('prescriptions', 'is_prn', {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  });

  await query.addColumn('prescriptions', 'is_variable_dose', {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  });

  await query.addColumn('prescriptions', 'dose_amount', {
    type: DataTypes.DECIMAL,
    allowNull: true,
  });

  await query.addColumn('prescriptions', 'units', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '',
  });

  await query.addColumn('prescriptions', 'frequency', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '',
  });

  await query.addColumn('prescriptions', 'start_date', {
    type: DataTypes.DATETIMESTRING,
    allowNull: false,
    defaultValue: '',
  });

  await query.addColumn('prescriptions', 'duration_value', {
    type: DataTypes.DECIMAL,
    allowNull: true,
  });

  await query.addColumn('prescriptions', 'duration_unit', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await query.addColumn('prescriptions', 'is_phone_order', {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  });

  await query.addColumn('prescriptions', 'ideal_times', {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  });

  await query.addColumn('prescriptions', 'pharmacy_notes', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await query.addColumn('prescriptions', 'display_pharmacy_notes_in_mar', {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  });

  await query.changeColumn('prescriptions', 'quantity', {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  });

  await query.renameColumn('prescriptions', 'note', 'notes');
}

export async function down(query: QueryInterface) {
  await query.removeColumn('prescriptions', 'is_ongoing');
  await query.removeColumn('prescriptions', 'is_prn');
  await query.removeColumn('prescriptions', 'is_variable_dose');
  await query.removeColumn('prescriptions', 'dose_amount');
  await query.removeColumn('prescriptions', 'units');
  await query.removeColumn('prescriptions', 'frequency');
  await query.removeColumn('prescriptions', 'start_date');
  await query.removeColumn('prescriptions', 'duration_value');
  await query.removeColumn('prescriptions', 'duration_unit');
  await query.removeColumn('prescriptions', 'is_phone_order');
  await query.removeColumn('prescriptions', 'ideal_times');
  await query.removeColumn('prescriptions', 'pharmacy_notes');
  await query.removeColumn('prescriptions', 'display_pharmacy_notes_in_mar');
  await query.changeColumn('prescriptions', 'quantity', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });
  await query.renameColumn('prescriptions', 'notes', 'note');
}
