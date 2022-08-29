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

export async function explainAnalyzeQuery(query, paramDefinitions = [], store, verbose) {
  try {
    const results = await store.sequelize.query(`EXPLAIN ANALYZE ${query}`, {
      type: QueryTypes.SELECT,
      replacements: getQueryReplacementsFromParams(paramDefinitions),
    });
    if (verbose) {
      const formattedResults = results.reduce(
        (a1, x) =>
          `${a1}\n${Object.entries(x).reduce((a2, [k, v]) => `${a2}\x1b[1m${k}:\x1b[0m ${v}`, '')}`,
        'Query valid explain analyze output:',
      );
      log.info(formattedResults);
    }
  } catch (err) {
    log.error(`Invalid query: ${err.message}`);
    process.exit(1);
  }
}
