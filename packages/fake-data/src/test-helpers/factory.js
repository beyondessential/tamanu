import { fake } from '../fake/index.ts';

const addAssociations = async (models, model, record) => {
  const newRecord = { ...record };

  for (const association of Object.values(model.associations)) {
    const { associationType, foreignKey, target } = association;
    if (associationType === 'BelongsTo') {
      if (!newRecord[foreignKey]) {
        newRecord[foreignKey] = await findOrCreateId(models, target);
      }
    }
  }

  return newRecord;
};

export const findOneOrCreate = async (models, model, where, insertOverrides) => {
  const existingRecord = await model.findOne({ where });
  if (existingRecord) {
    return existingRecord;
  }

  const overrides = { ...where, ...insertOverrides };
  const values = await addAssociations(models, model, fake(model, overrides));
  return model.create(values);
};

const findOrCreateId = async (models, model) => (await findOneOrCreate(models, model)).id;
