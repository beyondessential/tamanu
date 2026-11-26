import Sequelize from 'sequelize';
import { InvalidOperationError, NotFoundError } from '@tamanu/errors';
import { assertSchemaPermitted, verifyQuery } from './utils';

export async function createReportDefinitionVersion(
  { store, reportSchemaStores, canEditSchema },
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
  // A new version runs against its report's schema, whatever the request says.
  const existingReport = reportId
    ? await ReportDefinition.findByPk(reportId, { attributes: ['dbSchema'] })
    : null;
  if (reportId && !existingReport) {
    throw new NotFoundError(`No report found with id ${reportId}`);
  }
  const dbSchema = existingReport?.dbSchema ?? definition.dbSchema;
  assertSchemaPermitted(dbSchema, canEditSchema);
  await verifyQuery({
    query: definition.query,
    parameters: definition.queryOptions.parameters,
    dbSchema,
    reportSchemaStores,
  });
  return sequelize.transaction(
    {
      // Prevents race condition when determining the next version number
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    },
    async () => {
      const { name, dbSchema, ...definitionVersion } = definition;
      if (!reportId) {
        // The unique constraint on the name counts soft-deleted rows, so this lookup must too.
        const existingDefinition = await ReportDefinition.findOne({
          where: { name },
          attributes: ['id', 'deletedAt'],
          paranoid: false,
        });
        if (existingDefinition) {
          throw new InvalidOperationError(
            existingDefinition.deletedAt
              ? 'A deleted report is still using this name'
              : 'Report name already exists',
          );
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
