import type { Models } from '../types/model';

const belongsToTargets = (associations: Record<string, any>): string[] =>
  Object.values(associations)
    .filter(a => a.associationType === 'BelongsTo' && !a.isSelfAssociation)
    .map(a => a.target.name);

export function sortInDependencyOrder(models: Models): Array<Models[keyof Models]> {
  const sorted: Array<Models[keyof Models]> = [];
  const stillToSort = new Map(Object.entries(models).sort((a, b) => a[0].localeCompare(b[0])));

  // Changelog rows are replayed inside each record's batch and reference whatever ChangeLog
  // belongs to (users, via updated_by_user_id). ChangeLog is DO_NOT_SYNC so the sort can't see
  // that edge; derive the targets and make every other model depend on them.
  const changeLog = (Object.values(models)[0] as any)?.sequelize?.models?.ChangeLog;
  const changelogTargets = changeLog ? belongsToTargets(changeLog.associations) : [];

  while (stillToSort.size > 0) {
    const remaining = stillToSort.size;
    for (const [name, model] of stillToSort) {
      // Changelog targets only carry their own deps; injecting the target list into a target
      // would make multiple targets depend on each other.
      const isChangelogTarget = changelogTargets.includes(name);
      const dependsOn = [
        ...belongsToTargets(model.associations),
        ...(isChangelogTarget ? [] : changelogTargets),
      ];
      const dependenciesStillToSort = dependsOn.filter(d => stillToSort.has(d));
      if (dependenciesStillToSort.length === 0) {
        sorted.push(model);
        stillToSort.delete(name);
      }
    }
    if (stillToSort.size === remaining) {
      throw new Error(
        `sortInDependencyOrder: unresolvable dependency cycle among ${[...stillToSort.keys()].join(', ')}`,
      );
    }
  }

  return sorted;
}
