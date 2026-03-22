import { QueryInterface } from 'sequelize';
import { CHARTING_DATA_ELEMENT_IDS } from '@tamanu/constants';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    UPDATE survey_screen_components
    SET validation_criteria = (
      COALESCE(
        NULLIF(validation_criteria, '')::jsonb,
        '{}'::jsonb
      ) || '{"mandatory": true}'::jsonb
    )::text
    WHERE data_element_id = '${CHARTING_DATA_ELEMENT_IDS.dateRecorded}';
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    UPDATE survey_screen_components
    SET validation_criteria = CASE
      WHEN validation_criteria IS NULL OR validation_criteria = '' THEN NULL
      WHEN (validation_criteria::jsonb - 'mandatory') = '{}'::jsonb THEN NULL
      ELSE (validation_criteria::jsonb - 'mandatory')::text
    END
    WHERE data_element_id = '${CHARTING_DATA_ELEMENT_IDS.dateRecorded}';
  `);
}
