import { REPORT_DB_CONNECTIONS, REPORT_STATUSES } from '@tamanu/constants';
import { randomRecordId } from '../randomRecord.js';
import { pooledWithChild } from '../pool.js';

import { fake } from '../../fake/index.js';
import type { CommonParams } from './common.js';

interface CreateDbReportParams extends CommonParams {
  userId?: string;
}
export const createDbReport = async ({
  models,
  userId,
}: CreateDbReportParams): Promise<void> => {
  const { ReportDefinition, ReportDefinitionVersion } = models;

  const resolvedUserId = userId || (await randomRecordId(models, 'User'));

  const version = (reportDefinitionId: string) =>
    ReportDefinitionVersion.create(
      fake(ReportDefinitionVersion, {
        status: REPORT_STATUSES.DRAFT,
        queryOptions: `{"parameters": [], "defaultDateRange": "allTime"}`,
        reportDefinitionId,
        userId: resolvedUserId,
      }),
    );

  // Every definition shows in the reports list, so a round reuses one once the pool is full.
  await pooledWithChild(
    ReportDefinition,
    () =>
      ReportDefinition.create(
        fake(ReportDefinition, {
          dbSchema: REPORT_DB_CONNECTIONS.REPORTING,
        }),
      ),
    ReportDefinitionVersion,
    version,
    { childKey: 'reportDefinitionId' },
  );
};

interface UpdateDbReportParams extends CommonParams {
  userId?: string;
  reportDefinitionId?: string;
}
export const updateDbReport = async ({
  models,
  userId,
  reportDefinitionId,
}: UpdateDbReportParams): Promise<void> => {
  const { ReportDefinitionVersion } = models;

  const resolvedUserId = userId || (await randomRecordId(models, 'User'));

  await ReportDefinitionVersion.create(
    fake(ReportDefinitionVersion, {
      status: REPORT_STATUSES.DRAFT,
      queryOptions: `{"parameters": [], "defaultDateRange": "allTime"}`,
      reportDefinitionId: reportDefinitionId || (await randomRecordId(models, 'ReportDefinition')),
      userId: resolvedUserId,
    }),
  );
};
