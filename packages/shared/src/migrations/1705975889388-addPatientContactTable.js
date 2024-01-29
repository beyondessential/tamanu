import { DataTypes, Sequelize } from 'sequelize';

export async function up(query) {
  await query.createTable('patient_contacts', {
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

    name: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    method: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    connection_details: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    deletion_status: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    patient_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'id',
      },
    },
    relationship_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'reference_data',
        key: 'id',
      },
    },
  });
}

export async function down(query) {
  await query.dropTable('patient_contacts');
}
