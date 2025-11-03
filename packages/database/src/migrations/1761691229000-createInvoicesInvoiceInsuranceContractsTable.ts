import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

const tableName = 'invoices_invoice_insurance_contracts';

const baseFields = {
  id: {
    type: DataTypes.TEXT,
    defaultValue: Sequelize.fn('uuid_generate_v4'),
    allowNull: false,
    primaryKey: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.fn('now'),
    allowNull: false,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.fn('now'),
    allowNull: false,
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  updated_at_sync_tick: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0,
  },
};

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable(tableName, {
    ...baseFields,
    invoice_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: { model: 'invoices', key: 'id' },
      onDelete: 'CASCADE',
    },
    invoice_insurance_contract_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: { model: 'invoice_insurance_contracts', key: 'id' },
      onDelete: 'CASCADE',
    },
  });

  // Composite unique index to prevent duplicate links
  await query.addConstraint(tableName, {
    type: 'unique',
    fields: ['invoice_id', 'invoice_insurance_contract_id'],
    name: `${tableName}_invoice_contract_unique`,
  });

  await query.addIndex(tableName, ['invoice_id']);
  await query.addIndex(tableName, ['invoice_insurance_contract_id']);

  // Remove Invoice Insurers table
  await query.dropTable('invoice_insurers');
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable(tableName);

  // Not practical to add invoice_insurers table back and not in use at time of removal
}
