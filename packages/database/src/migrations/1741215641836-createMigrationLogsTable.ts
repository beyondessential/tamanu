import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

const TABLE = { schema: 'logs', tableName: 'migrations' };

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable(TABLE, {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('gen_random_uuid'),
    },
    logged_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('adjusted_timestamp'),
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
