import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('administered_vaccines', 'consent_given_by', {
    type: DataTypes.TEXT,
  });
}

export async function down(query) {
  await query.removeColumn('administered_vaccines', 'consent_given_by');
}
