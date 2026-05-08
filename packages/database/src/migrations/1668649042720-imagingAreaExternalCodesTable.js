import { DataTypes, Sequelize } from 'sequelize';

export async function up(query) {
  await query.createTable('imaging_area_external_codes', {
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

    pulled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    visibility_status: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'current',
    },

    area_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      references: {
        model: 'reference_data',
        key: 'id',
      },
    },
    code: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });
}

export async function down(query) {
  await query.dropTable('imaging_area_external_codes');
}
