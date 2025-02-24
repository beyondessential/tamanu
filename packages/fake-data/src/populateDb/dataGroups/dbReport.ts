import { REPORT_DB_SCHEMAS, REPORT_STATUSES } from '@tamanu/constants';
import type { Models } from '@tamanu/database';
const { fake } = require('@tamanu/shared/test-helpers/fake');

interface CreateDbReportDataParams {
  models: Models;
  userId: string;
}
export const createDbReport = async ({
  models: { ReportDefinition, ReportDefinitionVersion },
  userId,
}: CreateDbReportDataParams): Promise<void> => {
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
