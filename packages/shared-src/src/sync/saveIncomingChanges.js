import { groupBy } from 'lodash';
import { Op } from 'sequelize';
import { sortInDependencyOrder } from 'shared/models/sortInDependencyOrder';

const saveCreates = async (model, records) => model.bulkCreate(records);

const saveUpdates = async (model, records) =>
  Promise.all(records.map(async r => model.update(r, { where: { id: r.id } })));

const saveDeletes = async (model, recordIds) =>
  model.destroy({ where: { id: { [Op.in]: recordIds } } });

const saveChangesForModel = async (model, changes) => {
  // split changes into create, update, delete
  const idsForDelete = changes.filter(c => c.isDeleted).map(c => c.data.id);
  const idsForUpsert = changes.filter(c => !c.isDeleted && c.data.id).map(c => c.data.id);
  const existing = await model.findByIds(idsForUpsert);
  const existingIdSet = new Set(existing.map(e => e.id));
  const recordsForCreate = changes
    .filter(c => !c.isDeleted && !existingIdSet.has(c.data.id))
    .map(({ data }) => {
      // validateRecord(data, null); TODO add in validation
      return data;
    });
  const recordsForUpdate = changes
    .filter(r => !r.isDeleted && existingIdSet.has(r.data.id))
    .map(({ data }) => {
      // validateRecord(data, null); TODO add in validation
      return data;
    });

  // run each import process
  await saveCreates(model, recordsForCreate);
  await saveUpdates(model, recordsForUpdate);
  await saveDeletes(model, idsForDelete);
};

export const saveIncomingChanges = async (models, changes) => {
  const sortedModels = sortInDependencyOrder(models);

  const changesByRecordType = groupBy(changes, c => c.recordType);

  const [firstModel] = sortedModels; // arbitrary model to grab sequelize from
  await firstModel.sequelize.transaction(async () => {
    for (const model of sortedModels) {
      await saveChangesForModel(model, changesByRecordType[model.tableName] || []);
    }
  });
};
