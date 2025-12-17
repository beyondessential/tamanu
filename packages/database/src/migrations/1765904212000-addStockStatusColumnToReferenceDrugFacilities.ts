import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // Add computed column for stock_status
  // Logic:
  // - Default: 'unknown' (when quantity is NULL or can't be parsed)
  // - If quantity = 'unavailable' -> stock_status = 'unavailable'
  // - If quantity = 'unknown' -> stock_status = 'unknown'
  // - Otherwise, try to cast to integer:
  //   - If > 0 -> 'yes'
  //   - Otherwise -> 'no'
  // Note: GENERATED ALWAYS AS ... STORED means this column automatically
  // recalculates when quantity is updated, so no triggers needed.
  await query.sequelize.query(`
    ALTER TABLE reference_drug_facilities
    ADD COLUMN stock_status TEXT GENERATED ALWAYS AS (
      CASE
        WHEN quantity IS NULL THEN 'unknown'
        WHEN quantity = 'unavailable' THEN 'unavailable'
        WHEN quantity = 'unknown' THEN 'unknown'
        WHEN NULLIF(regexp_replace(quantity, '[^0-9]', '', 'g'), '')::integer IS NULL THEN 'unknown'
        WHEN NULLIF(regexp_replace(quantity, '[^0-9]', '', 'g'), '')::integer > 0 THEN 'yes'
        ELSE 'no'
      END
    ) STORED;
  `);

  // Add index on stock_status for faster filtering and sorting
  await query.addIndex('reference_drug_facilities', ['stock_status'], {
    name: 'reference_drug_facilities_stock_status_idx',
  });

  // Add composite index for common query patterns (facility_id + stock_status)
  await query.addIndex('reference_drug_facilities', ['facility_id', 'stock_status'], {
    name: 'reference_drug_facilities_facility_stock_idx',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeIndex(
    'reference_drug_facilities',
    'reference_drug_facilities_facility_stock_idx',
  );
  await query.removeIndex(
    'reference_drug_facilities',
    'reference_drug_facilities_stock_status_idx',
  );
  await query.sequelize.query(`
    ALTER TABLE reference_drug_facilities DROP COLUMN stock_status;
  `);
}
