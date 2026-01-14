import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;`);

  await query.sequelize.query(
    `CREATE INDEX IF NOT EXISTS patients_last_name_soundex_index ON patients(soundex(last_name));`,
  );
  await query.sequelize.query(`
    CREATE INDEX IF NOT EXISTS patients_deleted_at_index ON patients(deleted_at) WHERE deleted_at IS NULL;
  `);
  await query.sequelize.query(`
    CREATE INDEX IF NOT EXISTS patients_date_of_birth_index ON patients(date_of_birth);
  `);

  // Update function
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION public.find_potential_patient_duplicates(patient_data json)
      RETURNS SETOF patients
      LANGUAGE plpgsql
      STABLE PARALLEL SAFE
    AS $function$
        BEGIN      
          RETURN QUERY
        SELECT 
          p.*
        FROM patients p
        WHERE p.deleted_at IS NULL
          AND soundex(p.last_name) = soundex(patient_data->>'lastName')
          AND levenshtein(
            lower(concat(p.last_name, p.first_name)), 
            lower(concat(patient_data->>'lastName', patient_data->>'firstName'))
          ) <= 6
          AND (levenshtein(
            p.date_of_birth, 
            (patient_data->>'dateOfBirth')
          ) <= 1
          OR p.date_of_birth = concat_ws('-', 
            substring(patient_data->>'dateOfBirth', 1, 4), 
            substring(patient_data->>'dateOfBirth', 9, 2), 
            substring(patient_data->>'dateOfBirth', 6, 2)))
        LIMIT 5;
        END;
        $function$
    ;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION find_potential_patient_duplicates(
      patient_data JSON
    )
    RETURNS SETOF patients AS $$
    BEGIN      
      RETURN QUERY
      SELECT 
        p.*
      FROM 
        patients p
      WHERE 
        lower(p.first_name) = lower(patient_data->>'firstName') 
        AND lower(p.last_name) = lower(patient_data->>'lastName') 
        AND p.date_of_birth = patient_data->>'dateOfBirth'
        AND p.deleted_at IS NULL;
    END;
    $$ LANGUAGE plpgsql STABLE PARALLEL SAFE;
  `);

  await query.sequelize.query(`DROP INDEX IF EXISTS patients_date_of_birth_index;`);
  await query.sequelize.query(`DROP INDEX IF EXISTS patients_deleted_at_index;`);
  await query.sequelize.query(`DROP INDEX IF EXISTS patients_last_name_soundex_index;`);

  // Note: We don't drop the extension as it might be used by other functions
}
