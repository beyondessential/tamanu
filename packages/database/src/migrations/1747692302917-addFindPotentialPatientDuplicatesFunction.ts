import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
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
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DROP FUNCTION IF EXISTS find_potential_patient_duplicates;
  `);
}
