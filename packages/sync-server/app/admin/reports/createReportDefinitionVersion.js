import Sequelize from 'sequelize';
import { InvalidOperationError } from '@tamanu/shared/errors';
import { verifyQuery } from './utils';

export async function createReportDefinitionVersion(store, reportId, definition, userId) {
  const {
    models: { ReportDefinition, ReportDefinitionVersion },
    sequelize,
  } = store;

  if (definition.versionNumber) {
    throw new InvalidOperationError('Cannot create a report with a version number');
  }

  await verifyQuery(definition.query, definition.queryOptions.parameters, store);
  return sequelize.transaction(
    {
      // Prevents race condition when determining the next version number
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    },
    async () => {
      const { name, ...definitionVersion } = definition;
      const reportDefinitionId = reportId || (await ReportDefinition.create({ name })).id;
      const latestVersion = await ReportDefinitionVersion.findOne({
        where: { reportDefinitionId: reportId },
        attributes: ['versionNumber'],
        order: [['versionNumber', 'DESC']],
      });
      const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;
      const version = await ReportDefinitionVersion.create({
        ...definitionVersion,
        userId,
        versionNumber: nextVersionNumber,
        reportDefinitionId,
      });
      return { name, ...version };
    },
  );
}
