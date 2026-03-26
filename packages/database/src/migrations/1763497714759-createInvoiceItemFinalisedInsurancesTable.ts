import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

const TABLE = 'invoice_item_finalised_insurances';

const baseFields = {
  id: {
    type: DataTypes.STRING,
    defaultValue: Sequelize.fn('gen_random_uuid'),
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
  await query.createTable(TABLE, {
    ...baseFields,
    invoice_item_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'invoice_items', key: 'id' },
      onDelete: 'CASCADE',
    },
    coverage_value_final: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    invoice_insurance_plan_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: { model: 'invoice_insurance_plans', key: 'id' },
      onDelete: 'CASCADE',
    },
  });

  await query.addIndex(TABLE, ['invoice_insurance_plan_id']);
  await query.addIndex(TABLE, ['invoice_item_id', 'invoice_insurance_plan_id'], {
    unique: true,
    name: `idx_${TABLE}_id_plan_id_unique`,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable(TABLE);
}
