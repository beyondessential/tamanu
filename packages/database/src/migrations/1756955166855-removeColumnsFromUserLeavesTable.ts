import { DataTypes, QueryInterface } from 'sequelize';

const tableName = 'user_leaves';

export async function up(query: QueryInterface): Promise<void> {
  await query.removeColumn(tableName, 'removed_at');
  await query.removeColumn(tableName, 'removed_by');
  await query.removeColumn(tableName, 'scheduled_at');
  await query.removeColumn(tableName, 'scheduled_by');
}

export async function down(query: QueryInterface): Promise<void> {
  await query.addColumn(tableName, 'removed_at', {
    type: DataTypes.DATETIMESTRING,
    allowNull: true,
  });
  
  await query.addColumn(tableName, 'removed_by', {
    type: DataTypes.STRING,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  });
  
  await query.addColumn(tableName, 'scheduled_at', {
    type: DataTypes.DATETIMESTRING,
    allowNull: false,
  });
  
  await query.addColumn(tableName, 'scheduled_by', {
    type: DataTypes.STRING,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  });
}
