import Sequelize, { DataTypes } from 'sequelize';
import { VISIBILITY_STATUSES } from '@tamanu/constants';

export async function up(query) {
  await query.createTable('program_registry_conditions', {
    id: {
      type: DataTypes.STRING,
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

    code: {
      type: Sequelize.TEXT,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    visibility_status: {
      type: Sequelize.TEXT,
      defaultValue: VISIBILITY_STATUSES.CURRENT,
    },

    program_registry_id: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  });
}

export async function down(query) {
  await query.dropTable('program_registry_conditions');
}
