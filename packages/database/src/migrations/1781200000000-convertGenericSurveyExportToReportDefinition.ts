import { QueryInterface } from 'sequelize';

const GENERIC_SURVEY_EXPORT_REPORT_ID = 'generic-survey-export-line-list';
const GENERIC_SURVEY_EXPORT_VERSION_ID = 'db69159e-e291-49c6-a36c-958847f550e0';

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
  ],
  dataSources: ['thisFacility', 'allFacilities'],
  defaultDateRange: '30days',
});

export async function up(query: QueryInterface): Promise<void> {
  // Create a ReportDefinition to represent the static generic survey export report
  await query.sequelize.query(
    `
      INSERT INTO report_definitions (id, name, db_schema, created_at, updated_at, updated_at_sync_tick)
      VALUES (
        :id,
        'Generic Survey Export - Line List',
        'reporting',
        NOW(),
        NOW(),
        0
      )
      ON CONFLICT (id) DO NOTHING
    `,
    { replacements: { id: GENERIC_SURVEY_EXPORT_REPORT_ID } },
  );

  // Create a published ReportDefinitionVersion shell for the static report.
  // The query field is not used — the static report module handles data generation.
  await query.sequelize.query(
    `
      INSERT INTO report_definition_versions (
        id, version_number, status, query, query_options,
        report_definition_id, user_id, created_at, updated_at, updated_at_sync_tick
      )
      SELECT
        :versionId,
        1,
        'published',
        '',
        :queryOptions::jsonb,
        :reportDefinitionId,
        (SELECT id FROM users ORDER BY created_at ASC LIMIT 1),
        NOW(),
        NOW(),
        0
      WHERE NOT EXISTS (
        SELECT 1 FROM report_definition_versions
        WHERE report_definition_id = :reportDefinitionId
      )
    `,
    {
      replacements: {
        versionId: GENERIC_SURVEY_EXPORT_VERSION_ID,
        reportDefinitionId: GENERIC_SURVEY_EXPORT_REPORT_ID,
        queryOptions: QUERY_OPTIONS,
      },
    },
  );

  // For each StaticReport:run:generic-survey-export-line-list or general StaticReport:run
  // permission (no objectId), create a new ReportDefinition:run:generic-survey-export-line-list
  // permission on the same role. Roles with the general permission had access to all static
  // reports, so they should retain access to the only one being migrated.
  await query.sequelize.query(
    `
      INSERT INTO permissions (id, verb, noun, object_id, role_id, created_at, updated_at, updated_at_sync_tick)
      SELECT
        LOWER(role_id || '-run-ReportDefinition-' || :id),
        'run',
        'ReportDefinition',
        :id,
        role_id,
        NOW(),
        NOW(),
        0
      FROM permissions
      WHERE noun = 'StaticReport'
        AND verb = 'run'
        AND (object_id = :id OR object_id IS NULL)
        AND deleted_at IS NULL
      ON CONFLICT (id) DO NOTHING
    `,
    { replacements: { id: GENERIC_SURVEY_EXPORT_REPORT_ID } },
  );

  // Soft-delete all StaticReport:run permissions
  await query.sequelize.query(`
    UPDATE permissions
    SET deleted_at = NOW(),
        updated_at = NOW()
    WHERE noun = 'StaticReport'
      AND verb = 'run'
      AND deleted_at IS NULL
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  // Soft-delete the ReportDefinition:run:generic-survey-export-line-list permissions
  // that were created by this migration
  await query.sequelize.query(
    `
      UPDATE permissions
      SET deleted_at = NOW(),
          updated_at = NOW()
      WHERE noun = 'ReportDefinition'
        AND verb = 'run'
        AND object_id = :id
        AND deleted_at IS NULL
    `,
    { replacements: { id: GENERIC_SURVEY_EXPORT_REPORT_ID } },
  );

  // Restore the soft-deleted StaticReport:run permissions
  // DESTRUCTIVE: permissions that were already soft-deleted before this migration ran
  // will also be restored; their original deleted_at timestamps are not recoverable
  await query.sequelize.query(`
    UPDATE permissions
    SET deleted_at = NULL,
        updated_at = NOW()
    WHERE noun = 'StaticReport'
      AND verb = 'run'
  `);

  await query.sequelize.query(
    `
      DELETE FROM report_definition_versions
      WHERE report_definition_id = :id
    `,
    { replacements: { id: GENERIC_SURVEY_EXPORT_REPORT_ID } },
  );

  await query.sequelize.query(
    `
      DELETE FROM report_definitions
      WHERE id = :id
    `,
    { replacements: { id: GENERIC_SURVEY_EXPORT_REPORT_ID } },
  );
}
