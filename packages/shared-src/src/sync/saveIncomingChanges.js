import { groupBy } from 'lodash';
import { Op } from 'sequelize';
import { sortInDependencyOrder } from 'shared/models/sortInDependencyOrder';

const saveCreates = async (model, records) => model.bulkCreate(records);

const saveUpdates = async (model, records) =>
  Promise.all(records.map(async r => model.update(r, { where: { id: r.id } })));

const saveDeletes = async (model, recordIds) =>
  model.destroy({ where: { id: { [Op.in]: recordIds } } });

const saveChangesForModel = async (model, changes, isCentralServer) => {
  const sanitizeData = isCentralServer
    ? model.sanitizeForCentralServer
    : model.sanitizeForFacilityServer;

  // split changes into create, update, delete
  const idsForDelete = changes.filter(c => c.isDeleted).map(c => c.data.id);
  const idsForUpsert = changes.filter(c => !c.isDeleted && c.data.id).map(c => c.data.id);
  const existing = await model.findByIds(idsForUpsert);
  const idToUpdatedAtTick = Object.fromEntries(existing.map(e => [e.id, e.updatedAtSyncTick]));
  const recordsForCreate = changes
    .filter(c => !c.isDeleted && idToUpdatedAtTick[c.data.id] === undefined)
    .map(({ data }) => {
      // validateRecord(data, null); TODO add in validation
      return sanitizeData(data);
    });
  const recordsForUpdate = changes
    .filter(
      r =>
        !r.isDeleted &&
        !!idToUpdatedAtTick[r.data.id] &&
        // perform basic conflict resolution using last write wins, with respect to the
        // system-wide logical sync clock
        r.data.updatedAtSyncTick > idToUpdatedAtTick[r.data.id],
    )
    .map(({ data }) => {
      // validateRecord(data, null); TODO add in validation
      return sanitizeData(data);
    });

  // run each import process
  await saveCreates(model, recordsForCreate);
  await saveUpdates(model, recordsForUpdate);
  await saveDeletes(model, idsForDelete);
};

export const saveIncomingChanges = async (sequelize, models, changes, isCentralServer = false) => {
  const sortedModels = sortInDependencyOrder(models);
  const changesByRecordType = groupBy(changes, c => c.recordType);

  await sequelize.transaction(async () => {
    for (const model of sortedModels) {
      await saveChangesForModel(model, changesByRecordType[model.tableName] || [], isCentralServer);
    }
  });
};
