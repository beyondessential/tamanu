import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('program_registries', 'mandatory_condition_enabled', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: removes mandatory_condition_enabled values for all registries
  await query.removeColumn('program_registries', 'mandatory_condition_enabled');
}
