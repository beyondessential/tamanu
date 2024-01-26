import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.dropTable('user_localisation_caches');
}

export async function down(query) {
  await query.createTable('user_localisation_caches', {
    id: {
      type: DataTypes.STRING,
      defaultValue: Sequelize.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    localisation: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.STRING,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('current_timestamp', 3),
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('current_timestamp', 3),
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });
}
