import { log } from 'shared/services/logging';
import { QueryTypes } from 'sequelize';
import { getQueryReplacementsFromParams } from 'shared/utils/getQueryReplacementsFromParams';

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

export async function verifyQuery(query, paramDefinitions = [], store, verbose) {
  try {
    // use EXPLAIN instead of PREPARE because we don't want to stuff around deallocating the statement
    const results = await store.sequelize.query(`EXPLAIN ${query}`, {
      type: QueryTypes.SELECT,
      replacements: getQueryReplacementsFromParams(paramDefinitions),
    });
    if (verbose) {
      const formattedResults = results.reduce(
        (a1, x) =>
          `${a1}\n${Object.entries(x).reduce((a2, [k, v]) => `${a2}\x1b[1m${k}:\x1b[0m ${v}`, '')}`,
        'Explain output:',
      );
      log.info(formattedResults);
    }
  } catch (err) {
    log.error(`Invalid query: ${err.message}`);
    process.exit(1);
  }
}
