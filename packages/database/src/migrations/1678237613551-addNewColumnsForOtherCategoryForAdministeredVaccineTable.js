import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('administered_vaccines', 'vaccine_name', {
    type: DataTypes.TEXT,
  });

  await query.addColumn('administered_vaccines', 'vaccine_brand', {
    type: DataTypes.TEXT,
  });

  await query.addColumn('administered_vaccines', 'disease', {
    type: DataTypes.TEXT,
  });
}

export async function down(query) {
  await query.removeColumn('administered_vaccines', 'vaccine_name');
  await query.removeColumn('administered_vaccines', 'vaccine_brand');
  await query.removeColumn('administered_vaccines', 'disease');
}
