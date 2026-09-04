import { QueryInterface } from 'sequelize';

const GENERIC_SURVEY_EXPORT_REPORT_ID = 'generic-survey-export-line-list';
const GENERIC_SURVEY_EXPORT_VERSION_2_ID = 'ec87e2c9-6c8a-4f6b-9b3f-2f6f7b1e5f0a';

const QUERY_OPTIONS = JSON.stringify({
  parameters: [
    { parameterField: 'VillageField', name: 'village' },
    {
      parameterField: 'ParameterAutocompleteField',
      label: 'Survey',
      name: 'surveyId',
      suggesterEndpoint: 'survey',
      required: true,
    },
    {
      parameterField: 'ParameterCheckboxField',
      label: 'Include deleted responses',
      name: 'includeDeletedResponses',
    },
  ],
  dataSources: ['thisFacility', 'allFacilities'],
  defaultDateRange: '30days',
});

export async function up(query: QueryInterface): Promise<void> {
  // Publish a new version of the static generic survey export report with the
  // "includeDeletedResponses" checkbox parameter added. The previous version's row is left
  // untouched so any report request already tied to it keeps its original parameters.
  await query.sequelize.query(
    `
      INSERT INTO report_definition_versions (
        id, version_number, status, query, query_options,
        report_definition_id, user_id, created_at, updated_at, updated_at_sync_tick
      )
      SELECT
        :versionId,
        (SELECT COALESCE(MAX(version_number), 0) + 1 FROM report_definition_versions WHERE report_definition_id = :reportDefinitionId),
        'published',
        '',
        :queryOptions::jsonb,
        :reportDefinitionId,
        (SELECT id FROM users ORDER BY created_at ASC LIMIT 1),
        NOW(),
        NOW(),
        0
      WHERE NOT EXISTS (
        SELECT 1 FROM report_definition_versions WHERE id = :versionId
      )
    `,
    {
      replacements: {
        versionId: GENERIC_SURVEY_EXPORT_VERSION_2_ID,
        reportDefinitionId: GENERIC_SURVEY_EXPORT_REPORT_ID,
        queryOptions: QUERY_OPTIONS,
      },
    },
  );
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(
    `
      DELETE FROM report_definition_versions
      WHERE id = :versionId
    `,
    { replacements: { versionId: GENERIC_SURVEY_EXPORT_VERSION_2_ID } },
  );
}
