import type { Model } from '../models/Model';

export function getDependentAssociations(model: typeof Model) {
  return Object.values(model.associations).filter(({ associationType }) =>
    ['HasMany', 'HasOne'].includes(associationType),
  );
}
