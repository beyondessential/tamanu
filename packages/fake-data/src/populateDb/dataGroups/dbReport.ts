import { REPORT_DB_SCHEMAS, REPORT_STATUSES } from '@tamanu/constants';
import type { Models } from '@tamanu/database';
const { fake } = require('@tamanu/shared/test-helpers/fake');

interface CreateDbReportParams {
  models: Models;
  userId: string;
}
export const createDbReport = async ({
  models: { ReportDefinition, ReportDefinitionVersion },
  userId,
}: CreateDbReportParams): Promise<void> => {
  const reportDefinition = await ReportDefinition.create(
    fake(ReportDefinition, {
      dbSchema: REPORT_DB_SCHEMAS.REPORTING,
    }),
  );
  await ReportDefinitionVersion.create(
    fake(ReportDefinitionVersion, {
      status: REPORT_STATUSES.DRAFT,
      queryOptions: `{"parameters": [], "defaultDateRange": "allTime"}`,
      reportDefinitionId: reportDefinition.id,
      userId,
    }),
  );
};

interface CreateDbReportVersionParams extends CreateDbReportParams {
  reportDefinitionId: string;
}
export const createDbReportVersion = async ({
  models: { ReportDefinitionVersion },
  userId,
  reportDefinitionId,
}: CreateDbReportVersionParams): Promise<void> => {
  await ReportDefinitionVersion.create(
    fake(ReportDefinitionVersion, {
      status: REPORT_STATUSES.DRAFT,
      queryOptions: `{"parameters": [], "defaultDateRange": "allTime"}`,
      reportDefinitionId,
      userId,
    }),
  );
};
