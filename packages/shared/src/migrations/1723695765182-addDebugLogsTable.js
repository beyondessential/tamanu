import { DataTypes, Sequelize } from 'sequelize';

const TABLE = { tableName: 'debug_logs', schema: 'logs' };

export async function up(query) {
  await query.createTable(TABLE, {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    info: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  });
}

export async function down(query) {
  await query.dropTable(TABLE);
}
