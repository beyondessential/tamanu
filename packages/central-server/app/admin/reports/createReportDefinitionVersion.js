import Sequelize from 'sequelize';
import { InvalidOperationError } from '@tamanu/errors';
import { verifyQuery } from './utils';

export async function createReportDefinitionVersion(
  { store, reportSchemaStores },
  reportId,
  definition,
  userId,
) {
  const {
    models: { ReportDefinition, ReportDefinitionVersion },
    sequelize,
  } = store;

  if (definition.versionNumber) {
    throw new InvalidOperationError('Cannot create a report with a version number');
  }
  const { parameters } = definition.queryOptions;
  await verifyQuery(
    definition.query,
    { parameters },
    { reportSchemaStores, store },
    definition.dbSchema,
  );
  return sequelize.transaction(
    {
      // Prevents race condition when determining the next version number
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    },
    async () => {
      const { name, dbSchema, ...definitionVersion } = definition;
      if (!reportId) {
        const existingDefinition = await ReportDefinition.findOne({
          where: { name },
          attributes: ['id'],
        });
        if (existingDefinition) {
          throw new InvalidOperationError('Report name already exists');
        }
      }
      const reportDefinitionId = reportId || (await ReportDefinition.create({ name, dbSchema })).id;
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
      return { name, reportDefinitionId, ...version.get({ plain: true }) };
    },
  );
}
