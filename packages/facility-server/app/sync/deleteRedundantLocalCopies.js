import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { getModelsForDirections } from '@tamanu/database/sync';
import { Op } from 'sequelize';

// For any model marked as PUSH_TO_CENTRAL_THEN_DELETE, after a successful push, we can delete the
// facility server copy
export const deleteRedundantLocalCopies = async (models, changes) => {
  const modelsForPushThenDelete = getModelsForDirections(models, [
    SYNC_DIRECTIONS.PUSH_TO_CENTRAL_THEN_DELETE,
  ]);
  for (const model of Object.values(modelsForPushThenDelete)) {
    const changesForModel = changes.filter((change) => change.recordType === model.tableName);
    const idsToDelete = changesForModel.map((change) => change.recordId);
    await model.destroy({
      where: {
        id: { [Op.in]: idsToDelete },
      },
      force: true,
    });
  }
};
