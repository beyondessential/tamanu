/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { DataTypes } from 'sequelize';

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.dropTable('invoice_price_change_items');
  await query.dropTable('invoice_price_change_types');
  await query.dropTable('invoice_line_items');
  await query.dropTable('invoice_line_types');
  await query.dropTable('invoices', { cascade: true });

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

  await query.createTable('invoice_discounts', {
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
    percentage: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isManual: {
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
      type: DataTypes.DATE,
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

  await query.createTable('invoice_insurers', {
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

  await query.createTable('invoice_items', {
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
    order_date: {
      type: DataTypes.DATE,
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

  await query.createTable('invoice_item_discounts', {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    invoice_item_id: {
      type: DataTypes.STRING,
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

/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.dropTable('invoice_item_discounts', { cascade: true });
  await query.dropTable('invoice_items', { cascade: true });
  await query.dropTable('invoice_insurers', { cascade: true });
  await query.dropTable('invoice_discounts', { cascade: true });
  await query.dropTable('invoice_products', { cascade: true });
  await query.dropTable('invoices', { cascade: true });

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
