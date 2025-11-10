import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

const INSURANCE_CONTRACTS = 'invoice_insurance_plans';
const INSURANCE_CONTRACT_ITEMS = 'invoice_insurance_plan_items';

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
  await query.createTable(INSURANCE_CONTRACTS, {
    ...baseFields,
    code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    default_coverage: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    visibility_status: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'current',
    },
  });

  await query.addIndex(INSURANCE_CONTRACTS, ['code'], {
    name: `idx_${INSURANCE_CONTRACTS}_code_unique`,
    unique: true,
  });

  await query.createTable(INSURANCE_CONTRACT_ITEMS, {
    ...baseFields,
    invoice_insurance_plan_id: {
      type: DataTypes.TEXT,
      allowNull: false,
      references: {
        model: INSURANCE_CONTRACTS,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    invoice_product_id: {
      type: DataTypes.TEXT,
      allowNull: false,
      references: {
        model: 'invoice_products',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    coverage_value: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
  });

  await query.addIndex(INSURANCE_CONTRACT_ITEMS, ['invoice_insurance_plan_id'], {
    name: `idx_${INSURANCE_CONTRACT_ITEMS}_invoice_insurance_plan_id`,
  });

  await query.addIndex(INSURANCE_CONTRACT_ITEMS, ['invoice_product_id', 'invoice_insurance_plan_id'], {
    name: `idx_${INSURANCE_CONTRACT_ITEMS}_invoice_product_id_invoice_insurance_plan_id_unique`,
    unique: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable(INSURANCE_CONTRACT_ITEMS);
  await query.dropTable(INSURANCE_CONTRACTS);
}
