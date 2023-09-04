import Sequelize from 'sequelize';
import { InvalidOperationError } from '@tamanu/shared/errors';
import { verifyQuery } from './utils';

const createReportDefinition = async (store, name) => {
  const {
    models: { ReportDefinition },
  } = store;
  try {
    return (await ReportDefinition.create({ name })).id;
  } catch (error) {
    if (error.parent.code === '23505') {
      throw new Error('Report name already exists');
    } else {
      throw new Error(error.message);
    }
  }
};

export async function createReportDefinitionVersion(store, reportId, definition, userId) {
  const {
    models: { ReportDefinitionVersion },
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
      const reportDefinitionId = reportId || (await createReportDefinition(store, name));
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
