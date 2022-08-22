import { log } from 'shared/services/logging';

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
