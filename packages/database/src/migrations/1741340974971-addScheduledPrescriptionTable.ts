import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable('scheduled_prescriptions', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    administered_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    dose_amount: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    is_alert: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_edited: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    prescription_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'prescriptions',
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable('scheduled_prescriptions');
}
