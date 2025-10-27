import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // Change change_type from STRING to TEXT[] array
  await query.sequelize.query(`
    ALTER TABLE encounter_history 
    ALTER COLUMN change_type TYPE text[] 
    USING CASE 
      WHEN change_type IS NULL THEN NULL
      ELSE ARRAY[change_type]
    END;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  // Convert array back to single string (takes first element)
  await query.sequelize.query(`
    ALTER TABLE encounter_history 
    ALTER COLUMN change_type TYPE text 
    USING CASE 
      WHEN change_type IS NULL THEN NULL
      ELSE change_type[1]
    END;
  `);
}
