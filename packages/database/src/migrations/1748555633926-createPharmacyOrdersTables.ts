import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // Create pharmacy_orders table
  await query.createTable('pharmacy_orders', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: Sequelize.fn('gen_random_uuid'),
    },
    ordering_clinician_id: {
      type: DataTypes.TEXT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    encounter_id: {
      type: DataTypes.TEXT,
      allowNull: false,
      references: {
        model: 'encounters',
        key: 'id',
      },
    },
    comments: {
      type: DataTypes.TEXT,
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

  // Create pharmacy_order_prescriptions table
  await query.createTable('pharmacy_order_prescriptions', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: Sequelize.fn('gen_random_uuid'),
    },
    pharmacy_order_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'pharmacy_orders',
        key: 'id',
      },
    },
    prescription_id: {
      type: DataTypes.TEXT,
      allowNull: false,
      references: {
        model: 'prescriptions',
        key: 'id',
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    repeats: {
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
  await query.dropTable('pharmacy_order_prescriptions');
  await query.dropTable('pharmacy_orders');
}
