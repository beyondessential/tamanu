export function sortInDependencyOrder(models) {
  const sorted = [];
  const stillToSort = { ...models };
  while (Object.keys(stillToSort).length > 0) {
    Object.values(stillToSort).forEach(model => {
      const dependsOn = Object.values(model.associations)
        .filter(a => a.associationType === 'BelongsTo' && !a.isSelfAssociation)
        .map(a => a.target.name);
      const dependenciesStillToSort = dependsOn.filter(d => !!stillToSort[d]);
      if (dependenciesStillToSort.length === 0) {
        sorted.push(model);
        delete stillToSort[model.name];
      }
    });
  }
  return sorted;
}
