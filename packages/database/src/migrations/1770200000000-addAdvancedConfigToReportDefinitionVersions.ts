import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('report_definition_versions', 'advanced_config', {
    type: DataTypes.JSONB,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('report_definition_versions', 'advanced_config');
}
