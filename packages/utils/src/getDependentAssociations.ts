export function getDependentAssociations(model: { associations: { associationType: string }[] }) {
  return Object.values(model.associations).filter(({ associationType }) =>
    ['HasMany', 'HasOne'].includes(associationType),
  );
}
