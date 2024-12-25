import type { Model } from 'sequelize';

export function getDependentAssociations(model: typeof Model) {
  return Object.values(model.associations).filter(({ associationType }) =>
    ['HasMany', 'HasOne'].includes(associationType),
  );
}
