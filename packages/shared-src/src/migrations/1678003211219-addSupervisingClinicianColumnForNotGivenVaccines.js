import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('administered_vaccines', 'supervising_clinician', {
    type: DataTypes.TEXT,
  });
}

export async function down(query) {
  await query.removeColumn('administered_vaccines', 'supervising_clinician');
}
