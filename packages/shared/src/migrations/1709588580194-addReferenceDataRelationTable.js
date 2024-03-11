/* eslint-disable no-unused-vars */
// remove the above line

import Sequelize, { DataTypes } from 'sequelize';

export async function up(query) {
  await query.createTable(
    'reference_data_relations',
    {
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
      reference_data_id: {
        type: DataTypes.TEXT,
        allowNull: true,
        references: {
          model: 'reference_data',
          key: 'id',
        },
      },
      reference_data_parent_id: {
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
    },
    {
      uniqueKeys: {
        reference_data_id_type: {
          fields: ['reference_data_id', 'type'],
        },
      },
      indexes: [
        {
          name: 'reference_data_relations_reference_data_id_index',
          fields: ['reference_data_id'],
        },
        {
          name: 'reference_data_relations_parent_relation_id_index',
          fields: ['parent_relation_id'],
        },
        {
          name: 'reference_data_relations_type_index',
          fields: ['type'],
        },
      ],
    },
  );
}

export async function down(query) {
  await query.dropTable('reference_data_relations');
}
