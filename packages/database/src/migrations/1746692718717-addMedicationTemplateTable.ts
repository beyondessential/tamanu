import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable('medication_templates', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: Sequelize.fn('gen_random_uuid'),
    },
    reference_data_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'reference_data',
        key: 'id',
      },
    },
    medication_id: {
      type: DataTypes.STRING, 
      allowNull: true,
      references: {
        model: 'reference_data',
        key: 'id',
      },
    },
    is_prn: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    dose_amount: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    units: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    frequency: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    route: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    duration_value: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    duration_unit: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    discharge_quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable('medication_templates');
}
