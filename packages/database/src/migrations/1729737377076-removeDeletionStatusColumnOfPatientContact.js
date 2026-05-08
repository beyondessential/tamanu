import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.removeColumn('patient_contacts', 'deletion_status');
}

export async function down(query) {
  await query.addColumn('patient_contacts', 'deletion_status', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
}
