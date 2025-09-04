import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = { tableName: 'accesses', schema: 'logs' };
export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn(TABLE, 'portalUserId', {
    references: {
      model: { tableName: 'portal_users', schema: 'public' },
      key: 'id',
    },
    type: DataTypes.TEXT,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn(TABLE, 'portalUserId');
}
