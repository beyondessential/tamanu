import { QueryInterface, DataTypes } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable('appointment_procedure_types', {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    appointment_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'appointments',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    procedure_type_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'reference_data',
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await query.addIndex('appointment_procedure_types', ['appointment_id', 'procedure_type_id'], {
    unique: true,
    name: 'unique_appointment_procedure_type',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable('appointment_procedure_types');
}
