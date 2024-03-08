/* eslint-disable no-unused-vars */
// remove the above line

import Sequelize, { DataTypes } from 'sequelize';

export async function up(query) {
  await query.createTable('reference_data_relations', {
    id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
      allowNull: false,
      primaryKey: true,
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
    reference_datum_id: {
      type: DataTypes.TEXT,
      allowNull: true,
      references: {
        model: 'reference_data',
        key: 'id',
      },
    },
    parent_relation_id: {
      type: DataTypes.TEXT,
      allowNull: true,
      references: {
        model: 'reference_data',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });
}

export async function down(query) {
  await query.dropTable('reference_data_relations');
}
