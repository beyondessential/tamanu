import { log } from 'shared/services/logging';
import { QueryTypes } from 'sequelize';
import { getQueryReplacementsFromParams } from '../../../../shared-src/src/utils/getQueryReplacementsFromParams';

export async function findOrCreateDefinition(name, store) {
  const { ReportDefinition } = store.models;
  const [definition, created] = await ReportDefinition.findOrCreate({
    where: { name },
  });
  if (created) {
    log.info(`Created new report definition ${definition.name}`);
  }
  return definition;
}

export function getLatestVersion(versions, status) {
  return versions
    .sort((a, b) => b.versionNumber - a.versionNumber)
    .find(v => !status || v.status === status);
}

export async function explainAnalyzeQuery(query, paramDefinitions = [], store) {
  try {
    await store.sequelize.query(`EXPLAIN ANALYZE ${query}`, {
      type: QueryTypes.SELECT,
      replacements: getQueryReplacementsFromParams(paramDefinitions),
    });
    log.info('Query valid');
  } catch (err) {
    log.error(`Invalid query: ${err.message}`);
    process.exit(1);
  }
}
