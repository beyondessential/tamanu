import { DataTypes, Sequelize } from 'sequelize';

export async function up(query) {
  await query.createTable('tamanu_reviews', {
    id: {
      type: DataTypes.STRING,
      defaultValue: Sequelize.fn('gen_random_uuid'),
      allowNull: false,
      primaryKey: true,
    },
    is_positive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    submitted_by_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
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
  });
}

export async function down(query) {
  await query.dropTable('tamanu_reviews');
}
