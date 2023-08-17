import Sequelize from 'sequelize';
import { InvalidOperationError } from '@tamanu/shared/errors';
import { verifyQuery } from './utils';

export async function createReportDefinitionVersion(store, reportId, definitionVersion) {
  const {
    models: { ReportDefinitionVersion },
    sequelize,
  } = store;

  if (definitionVersion.versionNumber) {
    throw new InvalidOperationError('Cannot create a report with a version number');
  }

  await verifyQuery(definitionVersion.query, definitionVersion.queryOptions.parameters, store);
  return sequelize.transaction(
    {
      // Prevents race condition when determining the next version number
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    },
    async () => {
      const latestVersion = await ReportDefinitionVersion.findOne({
        where: { reportDefinitionId: reportId },
        attributes: ['versionNumber'],
        order: [['versionNumber', 'DESC']],
      });
      const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;
      const version = await ReportDefinitionVersion.create({
        ...definitionVersion,
        versionNumber: nextVersionNumber,
        reportDefinitionId: reportId,
      });
      return version;
    },
  );
}
