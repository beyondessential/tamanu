import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION find_potential_patient_duplicates(
      p_first_name text,
      p_last_name text,
      p_date_of_birth text
    )
    RETURNS SETOF patients AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        p.*
      FROM 
        patients p
      WHERE 
        lower(p.first_name) = lower(p_first_name) 
        AND lower(p.last_name) = lower(p_last_name) 
        AND p.date_of_birth = p_date_of_birth
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
