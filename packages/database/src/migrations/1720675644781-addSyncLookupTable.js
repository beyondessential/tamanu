import Sequelize, { DataTypes } from 'sequelize';

export async function up(query) {
  await query.createTable('sync_lookup', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    record_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    record_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    data: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    updated_at_sync_tick: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    patient_id: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    encounter_id: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    facility_id: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    is_lab_request: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
    },
    is_deleted: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
    },
    updated_at_by_field_sum: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  });

  await query.addConstraint('sync_lookup', {
    fields: ['record_id', 'record_type'],
    type: 'unique',
  });
}

export async function down(query) {
  await query.dropTable('sync_lookup');
}
