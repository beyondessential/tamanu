import { DataTypes, Sequelize } from 'sequelize';

export async function up(query) {
  await query.createTable('vital_logs', {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    date: {
      type: DataTypes.DATETIMESTRING,
      allowNull: false,
    },
    previous_value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    new_value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reason_for_change: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    recorded_by_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    answer_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'survey_response_answers',
        key: 'id',
      },
    },
  });
}

export async function down(query) {
  await query.dropTable('vital_logs');
}
