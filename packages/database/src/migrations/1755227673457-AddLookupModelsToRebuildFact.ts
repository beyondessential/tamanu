import { FACT_LOOKUP_MODELS_TO_REBUILD } from '@tamanu/constants';
import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION flag_lookup_model_to_rebuild(model_name text) RETURNS void AS $$
    BEGIN
      INSERT INTO local_system_facts (key, value)
      VALUES ('${FACT_LOOKUP_MODELS_TO_REBUILD}', model_name)
      ON CONFLICT (key) DO UPDATE SET value = 
        CASE 
        WHEN local_system_facts.value IS NULL OR local_system_facts.value = '' THEN
	          -- If the value is null or empty, set it to the model name
          model_name
        WHEN model_name = ANY(string_to_array(local_system_facts.value, ',')) THEN
          -- If the model name is already in the array, do nothing
          local_system_facts.value
        ELSE
          -- If the model name is not in the array, add it
          local_system_facts.value || ',' || model_name
        END;
    END;
    $$ LANGUAGE plpgsql;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DROP FUNCTION flag_lookup_model_to_rebuild(text);
  `);
}
