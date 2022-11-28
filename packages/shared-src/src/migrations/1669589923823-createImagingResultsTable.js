import { DataTypes } from 'sequelize';

export async function up(query) {
  query.createTable('imaging_results', {
    id: {
      type: DataTypes.UUID,
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

    updated_at_sync_tick: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
    visibility_status: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'current',
    },

    imaging_request_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'imaging_requests',
        key: 'id',
      },
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    external_code: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });
}

export async function down(query) {
  query.dropTable('imaging_results');
}
