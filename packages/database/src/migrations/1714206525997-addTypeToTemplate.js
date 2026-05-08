import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('templates', 'type', {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: 'patientLetter',
  });

  await query.changeColumn('templates', 'type', {
    type: DataTypes.TEXT,
    allowNull: false,
  });
}

export async function down(query) {
  await query.removeColumn('templates', 'type');
}
