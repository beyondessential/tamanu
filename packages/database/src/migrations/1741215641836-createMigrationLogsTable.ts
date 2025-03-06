import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = { schema: 'logs', tableName: 'migrations' };

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable(TABLE, {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    logged_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    current_sync_tick: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    direction: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    migrations: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable(TABLE);
}
