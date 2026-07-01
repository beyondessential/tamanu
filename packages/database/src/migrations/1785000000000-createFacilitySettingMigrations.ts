import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable('facility_setting_migrations', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('gen_random_uuid'),
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    key: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    value: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    facility_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'facilities',
        key: 'id',
      },
    },
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable('facility_setting_migrations');
}
