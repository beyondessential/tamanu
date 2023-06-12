import { DataTypes, Sequelize } from 'sequelize';

export async function up(query) {
  await query.createTable('lab_test_supersets', {
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    visibility_status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'current',
    },
  });

  await query.createTable('lab_test_superset_lab_test_panels', {
    id: {
      type: DataTypes.TEXT,
      allowNull: false,
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
    lab_test_superset_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'lab_test_supersets',
        key: 'id',
      },
    },
    lab_test_panel_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'lab_test_panels',
        key: 'id',
      },
    },
  });
}

export async function down(query) {
  await query.dropTable('lab_test_superset_lab_test_panels');
  await query.dropTable('lab_test_supersets');
}
