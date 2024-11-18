export function getDependantAssociations(model) {
  return Object.values(model.associations).filter(({ associationType }) =>
    ['HasMany', 'HasOne'].includes(associationType),
  );
}
