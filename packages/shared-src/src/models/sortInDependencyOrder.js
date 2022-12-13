export function sortInDependencyOrder(models) {
  const sorted = [];
  const stillToSort = new Map(Object.entries(models).sort((a, b) => a[0].localeCompare(b[0])));

  while (stillToSort.size > 0) {
    for (const [name, model] of stillToSort) {
      const dependsOn = Object.values(model.associations)
        .filter(a => a.associationType === 'BelongsTo' && !a.isSelfAssociation)
        .map(a => a.target.name);
      const dependenciesStillToSort = dependsOn.filter(d => !!stillToSort.has(d));
      if (dependenciesStillToSort.length === 0) {
        sorted.push(model);
        stillToSort.delete(name);
      }
    }
  }

  return sorted;
}
