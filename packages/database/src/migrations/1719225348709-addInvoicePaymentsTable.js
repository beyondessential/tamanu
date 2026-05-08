/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { DataTypes, Sequelize } from 'sequelize';

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.removeColumn('invoices', 'payment_status');
  await query.removeColumn('invoices', 'receipt_number');

  await query.createTable('invoice_payments', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    invoice_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'invoices',
        key: 'id',
      },
    },
    date: {
      type: DataTypes.DATESTRING,
      allowNull: false,
    },
    receipt_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await query.createTable('invoice_patient_payments', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    invoice_payment_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'invoice_payments',
        key: 'id',
      },
      unique: true,
    },
    method_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });
}
/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.addColumn('invoices', 'payment_status', {
    type: DataTypes.STRING,
    allowNull: false,
  });
  await query.addColumn('invoices', 'receipt_number', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await query.dropTable('invoice_patient_payments');
  await query.dropTable('invoice_payments');
}
