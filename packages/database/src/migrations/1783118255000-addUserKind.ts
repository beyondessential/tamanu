import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('users', 'kind', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'user',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: sync users will revert to looking like ordinary users.
  await query.removeColumn('users', 'kind');
}
