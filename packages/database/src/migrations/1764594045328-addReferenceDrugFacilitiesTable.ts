import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

export async function up(query: QueryInterface) {
  await query.createTable('reference_drug_facilities', {
    id: {
      type: `TEXT GENERATED ALWAYS AS (REPLACE("reference_drug_id"::TEXT, ';', ':') || ';' || REPLACE("facility_id", ';', ':')) STORED`,
    },
    reference_drug_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'reference_drugs',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    facility_id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'facilities',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    stock_status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'unknown',
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
  });

  // Add CHECK constraint for valid stock_status values
  await query.sequelize.query(`
    ALTER TABLE reference_drug_facilities
    ADD CONSTRAINT check_stock_status_values CHECK (
      stock_status IN ('in_stock', 'out_of_stock', 'unknown', 'unavailable')
    );
  `);

  // Add CHECK constraint to ensure consistency between quantity and stock_status
  await query.sequelize.query(`
    ALTER TABLE reference_drug_facilities
    ADD CONSTRAINT check_quantity_stock_consistency CHECK (
      (stock_status = 'in_stock' AND quantity > 0) OR
      (stock_status = 'out_of_stock' AND quantity = 0) OR
      (stock_status IN ('unknown', 'unavailable') AND quantity IS NULL)
    );
  `);

  // Add indexes for common query patterns
  await query.addIndex('reference_drug_facilities', ['stock_status'], {
    name: 'reference_drug_facilities_stock_status_idx',
  });

  await query.addIndex('reference_drug_facilities', ['facility_id', 'stock_status'], {
    name: 'reference_drug_facilities_facility_stock_idx',
  });
}

export async function down(query: QueryInterface) {
  await query.dropTable('reference_drug_facilities');
}
