import { log } from '@tamanu/shared/services/logging';

// A report's connection is settled on its definition, and its query is checked against that
// connection, so a new definition has to take the one the file declares rather than the default.
export async function findOrCreateDefinition(name, dbSchema, store) {
  const { ReportDefinition } = store.models;
  const [definition, created] = await ReportDefinition.findOrCreate({
    where: { name },
    defaults: dbSchema ? { dbSchema } : {},
  });
  if (created) {
    log.info(
      `Created new report definition ${definition.name} on the ${definition.dbSchema} schema`,
    );
  } else if (dbSchema && definition.dbSchema !== dbSchema) {
    throw new Error(
      `Report ${name} is on the ${definition.dbSchema} schema, so it cannot take a ${dbSchema} version`,
    );
  }
  return definition;
}

export function getLatestVersion(versions, status) {
  return versions
    .sort((a, b) => b.versionNumber - a.versionNumber)
    .find(v => !status || v.status === status);
}
