import { log } from 'shared/services/logging';
import { shouldPush } from './directions';
import { ensurePathsAreExhaustive } from './metadata';

const shouldMark = model => model.syncClientMode && shouldPush(model);

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
    leafModel.addHook('beforeSave', 'markRootWhenChildChanged', async rawRecord => {
      // walk backward through the associations and find the parent at each level
      let currentRecord = rawRecord;
      for (const { source, foreignKey } of reversedAssociations) {
        currentRecord = await source.findByPk(currentRecord[foreignKey]);
        if (!currentRecord) {
          log.warn(`markRootForPush: no parent matching ${foreignKey}`);
          return;
        }
      }

      // mark the parent record for push
      const currentModel = currentRecord.constructor;
      log.debug(`markRootForPush: marking ${currentModel.name}[${currentRecord.id}]`);
      // always set updatedAt, but only mark for push on client
      currentRecord.changed('updatedAt', true);
      if (shouldMark(currentModel)) {
        currentRecord.markedForPush = true;
      }
      await currentRecord.save();
    });
  }
};

const syncSpecificColumns = ['markedForPush', 'isPushing', 'markedForSync', 'pushedAt', 'pulledAt'];

export const initSyncHooks = models => {
  Object.values(models).forEach(model => {
    // add hook to model itself
    if (shouldMark(model)) {
      model.addHook('beforeSave', 'markForPush', record => {
        const changedFields = record?.changed() || [];

        // if only sync related columns were changed, it's not a change we care to sync elsewhere
        if (changedFields.every(field => syncSpecificColumns.includes(field))) {
          return;
        }

        // if this change was caused by an import, we don't want to sync it back up to the server
        if (changedFields.includes('pulledAt')) {
          return;
        }

        // we're using this the right way for a sequelize hook
        // eslint-disable-next-line no-param-reassign
        record.markedForPush = true;
      });
    }

    // add hook to nested sync relations
    addHooksToNested(model);
  });
};
