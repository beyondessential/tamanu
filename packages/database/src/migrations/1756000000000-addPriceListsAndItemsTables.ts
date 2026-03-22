import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

const INVOICE_PRICE_LISTS = 'invoice_price_lists';
const INVOICE_PRICE_LIST_ITEMS = 'invoice_price_list_items';

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
  // price_lists
  await query.createTable(INVOICE_PRICE_LISTS, {
    ...baseFields,
    code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rules: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    visibility_status: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'current',
    },
  });

  await query.addIndex(INVOICE_PRICE_LISTS, ['code'], {
    name: `idx_${INVOICE_PRICE_LISTS}_code_unique`,
    unique: true,
  });

  // invoice_price_list_items
  await query.createTable(INVOICE_PRICE_LIST_ITEMS, {
    ...baseFields,
    invoice_price_list_id: {
      type: DataTypes.TEXT,
      allowNull: false,
      references: {
        model: INVOICE_PRICE_LISTS,
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
    price: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
  });

  await query.addIndex(INVOICE_PRICE_LIST_ITEMS, ['invoice_price_list_id'], {
    name: `idx_${INVOICE_PRICE_LIST_ITEMS}_price_list_id`,
  });

  await query.addIndex(INVOICE_PRICE_LIST_ITEMS, ['invoice_price_list_id', 'invoice_product_id'], {
    name: `idx_${INVOICE_PRICE_LIST_ITEMS}_price_list_id_invoice_product_id_unique`,
    unique: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeIndex(
    INVOICE_PRICE_LIST_ITEMS,
    `idx_${INVOICE_PRICE_LIST_ITEMS}_price_list_id_invoice_product_id_unique`,
  );
  await query.removeIndex(
    INVOICE_PRICE_LIST_ITEMS,
    `idx_${INVOICE_PRICE_LIST_ITEMS}_price_list_id`,
  );
  await query.dropTable(INVOICE_PRICE_LIST_ITEMS, {});

  await query.removeIndex(INVOICE_PRICE_LISTS, `idx_${INVOICE_PRICE_LISTS}_code_unique`);
  await query.dropTable(INVOICE_PRICE_LISTS, {});
}
