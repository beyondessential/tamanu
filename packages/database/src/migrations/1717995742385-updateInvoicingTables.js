/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { DataTypes, Sequelize } from 'sequelize';

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.dropTable('invoice_price_change_items');
  await query.dropTable('invoice_price_change_types');
  await query.dropTable('invoice_line_items');
  await query.dropTable('invoice_line_types');
  await query.dropTable('invoices');

  await query.createTable('invoice_products', {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    discountable: {
      // only apply for invoice discount, not item discount
      type: DataTypes.BOOLEAN,
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

  await query.createTable('invoices', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    display_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATETIMESTRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    payment_status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    receipt_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    encounter_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'encounters',
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await query.createTable('invoice_discounts', {
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
    percentage: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_manual: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    applied_by_user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    applied_time: {
      type: DataTypes.DATETIMESTRING,
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

  await query.createTable('invoice_insurers', {
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
    insurer_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'reference_data',
        key: 'id',
      },
    },
    percentage: {
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

  await query.createTable('invoice_items', {
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
    order_date: {
      type: DataTypes.DATESTRING,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'invoice_products',
        key: 'id',
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    product_price: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    ordered_by_user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },

    source_id: {
      type: DataTypes.UUID,
      allowNull: true,
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

  await query.createTable('invoice_item_discounts', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    invoice_item_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'invoice_items',
        key: 'id',
      },
    },
    percentage: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
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

  await query.addColumn('invoice_items', 'product_code', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  // await query.addIndex('invoices', ['encounter_id'], {
  //   where: { deleted_at: null },
  //   unique: true,
  //   name: 'invoices_encounter_id_unique',
  // });

  // await query.addIndex('invoice_discounts', ['invoice_id'], {
  //   where: { deleted_at: null },
  //   unique: true,
  //   name: 'invoice_discounts_invoice_id_unique',
  // });

  // await query.addIndex('invoice_item_discounts', ['invoice_item_id'], {
  //   where: { deleted_at: null },
  //   unique: true,
  //   name: 'invoice_item_discounts_invoice_item_id_unique',
  // });
}

/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.removeColumn('invoice_items', 'product_code');

  // await query.removeIndex('invoices', 'invoices_encounter_id_unique');

  // await query.removeIndex('invoice_discounts', 'invoice_discounts_invoice_id_unique');

  // await query.removeIndex(
  //   'invoice_item_discounts',
  //   'invoice_item_discounts_invoice_item_id_unique',
  // );

  await query.dropTable('invoice_item_discounts', {});
  await query.dropTable('invoice_items');
  await query.dropTable('invoice_insurers');
  await query.dropTable('invoice_discounts');
  await query.dropTable('invoice_products');
  await query.dropTable('invoices');

  await query.createTable('invoices', {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    display_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    encounter_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'encounters',
        key: 'id',
      },
    },
    total: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    payment_status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    receipt_number: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    date: {
      type: 'date_string',
      allowNull: true,
    },
    date_legacy: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    discount_markup_percentage: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    discount_markup_reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await query.createTable('invoice_line_types', {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    item_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    item_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await query.createTable('invoice_line_items', {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    invoice_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'invoices',
        key: 'id',
      },
    },
    invoice_line_type_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'invoice_line_types',
        key: 'id',
      },
    },
    date_generated: {
      type: 'date_string',
      allowNull: false,
    },
    date_generated_legacy: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    percentage_change: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    discount_markup_reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await query.createTable('invoice_price_change_types', {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    item_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    item_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    percentage_change: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await query.createTable('invoice_price_change_items', {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    invoice_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'invoices',
        key: 'id',
      },
    },
    invoice_price_change_type_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'invoice_price_change_types',
        key: 'id',
      },
    },
    ordered_by_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    date: {
      type: 'date_string',
      allowNull: false,
    },
    date_legacy: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    percentage_change: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });
}
