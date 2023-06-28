import Sequelize, { DataTypes } from 'sequelize';

export async function up(query) {
  await query.createTable('encounter_history', {
    id: {
      type: DataTypes.UUID,
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
    date: {
      type: DataTypes.DATETIMESTRING,
      allowNull: true,
    },
    encounter_id: {
      type: DataTypes.STRING,
      references: {
        model: 'encounters',
        key: 'id',
      },
      allowNull: false,
    },
    department_id: {
      type: DataTypes.STRING,
      references: {
        model: 'departments',
        key: 'id',
      },
      allowNull: false,
    },
    location_id: {
      type: DataTypes.STRING,
      references: {
        model: 'locations',
        key: 'id',
      },
      allowNull: false,
    },
    examiner_id: {
      type: DataTypes.STRING,
      references: {
        model: 'users',
        key: 'id',
      },
      allowNull: false,
    },
    encounter_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });
}

export async function down(query) {
  await query.dropTable('encounter_history');
}
