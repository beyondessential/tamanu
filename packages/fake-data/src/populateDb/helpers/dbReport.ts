import { REPORT_DB_SCHEMAS, REPORT_STATUSES } from '@tamanu/constants';
import { randomRecordId } from '@tamanu/database/demoData/utilities';

import { fake } from '../../fake';
import type { CommonParams, ExtendedCommonParams } from './common';

interface CreateDbReportParams extends CommonParams {
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

interface UpdateDbReportParams extends CommonParams {
  userId: string;
  reportDefinitionId: string;
}
export const updateDbReport = async ({
  models,
  userId,
  reportDefinitionId,
}: UpdateDbReportParams): Promise<void> => {
  const { ReportDefinitionVersion } = models;
  await ReportDefinitionVersion.create(
    fake(ReportDefinitionVersion, {
      status: REPORT_STATUSES.DRAFT,
      queryOptions: `{"parameters": [], "defaultDateRange": "allTime"}`,
      reportDefinitionId: reportDefinitionId || (await randomRecordId(models, 'ReportDefinition')),
      userId,
    }),
  );
};
