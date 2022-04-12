import { shouldPush } from './directions';
import { ensurePathsAreExhaustive } from './metadata';
import { SYNC_CLS_NAMESPACE } from './clsNamespace';

const syncSpecificColumns = ['markedForPush', 'isPushing', 'markedForSync', 'pushedAt', 'pulledAt'];
const shouldMark = record => {
  const changedFields = record?.changed() || [];

  // if only sync related columns were changed, it's not a change we care to sync elsewhere
  if (changedFields.every(field => syncSpecificColumns.includes(field))) {
    return false;
  }

  // if this change was caused by an import or export, we don't want to sync it back up to the server
  const isImporting = SYNC_CLS_NAMESPACE.get('isImporting');
  const isExporting = SYNC_CLS_NAMESPACE.get('isExporting');
  if (isImporting || isExporting) {
    return false;
  }

  return true;
};

const addHooksToNested = model => {
  // for every relation defined in includedRelations, including intermediates
  for (const relationPath of ensurePathsAreExhaustive(model.syncConfig.includedRelations)) {
    // traverse a path like 'foo.bars.bazes' and retrieve an array of association metadata
    const pathSegments = relationPath.split('.');
    const associations = [];
    pathSegments.reduce((currentModel, segment) => {
      const association = currentModel.associations[segment];
      if (!association) {
        throw new Error(`could not find association ${segment} on ${currentModel.name}`);
      }
      associations.push(association);
      return association.target;
    }, model);

    // find the outermost leaf record
    const leafModel = associations[associations.length - 1].target;

    const reversedAssociations = associations.reverse();
    leafModel.addHook('beforeSave', 'markRootForPush', async rawRecord => {
      if (!shouldMark(rawRecord)) {
        return;
      }
      let currentRecord = rawRecord;
      // walk backward through the associations and find the parent at each level
      for (const { source, foreignKey } of reversedAssociations) {
        currentRecord = await source.findByPk(currentRecord[foreignKey]);
        if (!currentRecord) {
          return;
        }
      }
      // mark the parent record for push
      currentRecord.markedForPush = true;
      await currentRecord.save();
    });
  }
};

export const initSyncClientModeHooks = models => {
  Object.values(models)
    .filter(model => model.syncClientMode && shouldPush(model))
    .forEach(model => {
      // add hook to model itself
      model.addHook('beforeSave', 'markForPush', record => {
        if (!shouldMark(record)) {
          return;
        }
        // we're using this the right way for a sequelize hook
        // eslint-disable-next-line no-param-reassign
        record.markedForPush = true;
      });

      // add hook to nested sync relations
      addHooksToNested(model);
    });
};
