import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

const PRICE_LISTS = 'price_lists';
const PRICE_LIST_ITEMS = 'price_list_items';

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
  await query.createTable(PRICE_LISTS, {
    ...baseFields,
    code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
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

  await query.addIndex(PRICE_LISTS, ['code'], {
    name: `idx_${PRICE_LISTS}_code_unique`,
    unique: true,
  });

  // price_list_items
  await query.createTable(PRICE_LIST_ITEMS, {
    ...baseFields,
    price_list_id: {
      type: DataTypes.TEXT,
      allowNull: false,
      references: {
        model: PRICE_LISTS,
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
    },
    price: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
  });

  await query.addIndex(PRICE_LIST_ITEMS, ['price_list_id'], {
    name: `idx_${PRICE_LIST_ITEMS}_price_list_id`,
  });

  await query.addIndex(PRICE_LIST_ITEMS, ['price_list_id', 'invoice_product_id'], {
    name: `idx_${PRICE_LIST_ITEMS}_price_list_id_invoice_product_id_unique`,
    unique: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeIndex(
    PRICE_LIST_ITEMS,
    `idx_${PRICE_LIST_ITEMS}_price_list_id_invoice_product_id_unique`,
  );
  await query.removeIndex(PRICE_LIST_ITEMS, `idx_${PRICE_LIST_ITEMS}_price_list_id`);
  await query.dropTable(PRICE_LIST_ITEMS, {});

  await query.removeIndex(PRICE_LISTS, `idx_${PRICE_LISTS}_code_unique`);
  await query.dropTable(PRICE_LISTS, {});
}
