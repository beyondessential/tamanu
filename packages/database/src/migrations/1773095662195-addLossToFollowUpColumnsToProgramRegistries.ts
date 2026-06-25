import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('program_registries', 'loss_to_follow_up_enabled', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
  await query.addColumn('program_registries', 'loss_to_follow_up_threshold_days', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 90,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: removes loss_to_follow_up_enabled and loss_to_follow_up_threshold_days values for all registries
  await query.removeColumn('program_registries', 'loss_to_follow_up_threshold_days');
  await query.removeColumn('program_registries', 'loss_to_follow_up_enabled');
}
