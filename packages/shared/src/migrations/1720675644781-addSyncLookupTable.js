import Sequelize, { DataTypes } from 'sequelize';

export async function up(query) {
  await query.createTable('sync_lookup', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    record_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
      allowNull: false,
    },
    facility_id: {
      type: Sequelize.STRING,
      allowNull: false,
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
    }
  });
}

export async function down(query) {
  await query.dropTable('sync_lookup');
}
