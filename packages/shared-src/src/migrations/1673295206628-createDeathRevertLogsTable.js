import { DataTypes, Sequelize } from 'sequelize';

export async function up(query) {
  await query.createTable('death_revert_logs', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
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

    revert_time: {
      type: DataTypes.DATETIMESTRING,
      allowNull: false,
    },
    death_data_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    patient_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'id',
      },
    },
    reverted_by_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  });
}

export async function down(query) {
  await query.dropTable('death_revert_logs');
}
