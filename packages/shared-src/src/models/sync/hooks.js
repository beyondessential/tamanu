import { shouldPush } from './directions';
import { propertyPathsToTree, ensurePathsAreExhaustive } from './metadata';

const addHooksToNested = model => {
  // for every relation defined in includedSyncRelations, including intermediates
  for (const relationPath of ensurePathsAreExhaustive(model.includedSyncRelations)) {
    // traverse a path like 'foo.bars.bazes' and retrieve an array of association metadata
    const pathSegments = relationPath.split('.');
    const associations = [];
    pathSegments.reduce((currentModel, segment) => {
      const association = currentModel.associations[segment];
      associations.push(association);
      return association.target;
    }, model);

    // find the outermost leaf record
    const leafModel = associations[associations.length - 1].target;

    const reversedAssociations = associations.reverse();
    leafModel.addHook('beforeSave', 'markRootForPush', async (rawRecord) => {
      let currentRecord = rawRecord;
      // walk backward through the associations and find the parent at each level
      for (const { source, foreignKey } of reversedAssociations) {
        currentRecord = await source.findByPk(currentRecord[foreignKey]);
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
        if (!record.changed || (!record.changed('pushedAt') && !record.changed('pushedAt'))) {
          record.markedForPush = true;
        }
      });

      // add hook to nested sync relations
      addHooksToNested(model);
    });
};
