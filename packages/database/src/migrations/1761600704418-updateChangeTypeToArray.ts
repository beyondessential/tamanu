import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    ALTER TABLE encounter_history 
    ALTER COLUMN change_type TYPE text[] 
    USING CASE 
      WHEN change_type IS NULL THEN ARRAY[]::text[]
      ELSE ARRAY[change_type]
    END;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    ALTER TABLE encounter_history 
    ALTER COLUMN change_type TYPE text 
    USING CASE 
      WHEN cardinality(change_type) = 0 THEN NULL
      ELSE change_type[1]
    END;
  `);
}
