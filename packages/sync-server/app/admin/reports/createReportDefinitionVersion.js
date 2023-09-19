import Sequelize from 'sequelize';
import config from 'config';
import { InvalidOperationError } from '@tamanu/shared/errors';
import { REPORT_DB_ROLES } from '@tamanu/constants/reports';
import { verifyQuery } from './utils';

const getConfigReportingRole = dbRole => {
  const {
    db: { reportingRoles },
  } = config;
  switch (dbRole) {
    case REPORT_DB_ROLES.DATASET:
      return reportingRoles.dataset;
    case REPORT_DB_ROLES.RAW:
      return reportingRoles.raw;
    default:
      return null;
  }
};

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
      const { name, dbRole, ...definitionVersion } = definition;
      const configReportingRole = await getConfigReportingRole(dbRole);
      if (!reportId) {
        const existingDefinition = await ReportDefinition.findOne({
          where: { name },
          attributes: ['id'],
        });
        if (existingDefinition) {
          throw new InvalidOperationError('Report name already exists');
        }
      }
      const reportDefinitionId =
        reportId || (await ReportDefinition.create({ name, dbRole: configReportingRole })).id;
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
