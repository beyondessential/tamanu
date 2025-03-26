import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

const TABLE = { tableName: 'accesses', schema: 'logs' };

export async function up(query: QueryInterface): Promise<void> {
  await query.changeColumn(TABLE, 'id', {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    defaultValue: Sequelize.fn('gen_random_uuid'),
  });
  await query.addColumn(TABLE, 'created_at', {
    type: DataTypes.DATE,
    allowNull: false,
  });
  await query.addColumn(TABLE, 'updated_at', {
    type: DataTypes.DATE,
    allowNull: false,
  });
  await query.addColumn(TABLE, 'deleted_at', {
    type: DataTypes.DATE,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.changeColumn(TABLE, 'id', {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    defaultValue: Sequelize.fn('uuid_generate_v4'),
  });
  await query.removeColumn(TABLE, 'created_at');
  await query.removeColumn(TABLE, 'updated_at');
  await query.removeColumn(TABLE, 'deleted_at');
}
