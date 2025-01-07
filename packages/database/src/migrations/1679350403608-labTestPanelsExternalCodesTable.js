import { DataTypes, Sequelize } from 'sequelize';

export async function up(query) {
  await query.createTable('lab_test_panel_external_codes', {
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

    visibility_status: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'current',
    },

    lab_test_panel_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      references: {
        model: 'lab_test_panels',
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

  await query.removeColumn('imaging_area_external_codes', 'pulled_at');
}

export async function down(query) {
  await query.dropTable('lab_test_panel_external_codes');
  await query.addColumn('imaging_area_external_codes', 'pulled_at', {
    type: DataTypes.DATE,
    allowNull: true,
  });
}
