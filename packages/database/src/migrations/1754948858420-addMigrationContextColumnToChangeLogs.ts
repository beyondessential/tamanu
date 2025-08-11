import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = {
  tableName: 'changes',
  schema: 'logs',
}

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn(TABLE, 'migration_context', {
    type: DataTypes.JSONB,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn(TABLE, 'migration_context');
}
