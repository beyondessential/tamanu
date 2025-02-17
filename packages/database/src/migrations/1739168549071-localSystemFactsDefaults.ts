import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.changeColumn('local_system_facts', 'id', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: Sequelize.fn('gen_random_uuid'),
  });
  await query.changeColumn('local_system_facts', 'created_at', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: Sequelize.fn('now'),
  });
  await query.changeColumn('local_system_facts', 'updated_at', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: Sequelize.fn('now'),
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.changeColumn('local_system_facts', 'id', {
    type: DataTypes.STRING,
    allowNull: false,
  });
  await query.changeColumn('local_system_facts', 'created_at', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await query.changeColumn('local_system_facts', 'updated_at', {
    type: DataTypes.STRING,
    allowNull: true,
  });
}
