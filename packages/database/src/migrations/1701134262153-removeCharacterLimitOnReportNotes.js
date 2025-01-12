import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.changeColumn('report_definition_versions', 'notes', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
}

export async function down(query) {
  await query.changeColumn('report_definition_versions', 'notes', {
    type: DataTypes.STRING,
    allowNull: true,
  });
}
