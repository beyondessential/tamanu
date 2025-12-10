import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

const TABLE_NAME = 'portal_one_time_tokens';

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable(TABLE_NAME, {
    id: {
      type: DataTypes.TEXT,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
      allowNull: false,
      primaryKey: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    portal_user_id: {
      type: DataTypes.TEXT,
      references: {
        model: 'portal_users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'login',
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATETIMESTRING,
      allowNull: false,
    },
  });

  await query.addIndex(TABLE_NAME, ['portal_user_id'], {
    name: `idx_${TABLE_NAME}_portal_user_id`,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeIndex(TABLE_NAME, `idx_${TABLE_NAME}_portal_user_id`);
  await query.dropTable(TABLE_NAME, {});
}
