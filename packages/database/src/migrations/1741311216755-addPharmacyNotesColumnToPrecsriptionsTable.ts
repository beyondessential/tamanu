import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface) {
  await query.addColumn('prescriptions', 'pharmacy_notes', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await query.addColumn('prescriptions', 'display_pharmacy_notes_in_mar', {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  });

}

export async function down(query: QueryInterface) {
  await query.removeColumn('prescriptions', 'pharmacy_notes');
  await query.removeColumn('prescriptions', 'display_pharmacy_notes_in_mar');

}
