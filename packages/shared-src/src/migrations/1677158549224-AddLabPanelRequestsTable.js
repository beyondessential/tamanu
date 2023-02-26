import { DataTypes, Sequelize } from 'sequelize';

export async function up(query) {
  await query.createTable('lab_panel_requests', {
    id: {
      type: DataTypes.STRING,
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
    lab_test_panel_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'lab_test_panels',
        key: 'id',
      },
    },
    encounter_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'encounters',
        key: 'id',
      },
    },
  });
}

export async function down(query) {
  await query.dropTable('lab_panel_requests');
}
