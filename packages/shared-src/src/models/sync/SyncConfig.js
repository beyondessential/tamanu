import * as yup from 'yup';
import { log } from 'shared/services/logging';
import { SYNC_DIRECTIONS, SYNC_DIRECTIONS_VALUES } from 'shared/constants';

const syncConfigOptionsSchema = yup.object({
  // whether a model should be pushed to the server, pulled from the server, or both
  syncDirection: yup
    .string()
    .oneOf(SYNC_DIRECTIONS_VALUES)
    .required(),
  // list of columns to exclude when syncing
  excludedColumns: yup.array(yup.string()).test(v => !!v),
  // list of relations to include when syncing, may be deeply nested
  // e.g. ['labRequests', 'labRequests.tests']
  includedRelations: yup.array(yup.string()).test(v => !!v),
});

export class SyncConfig {
  syncDirection;

  excludedColumns;

  includedRelations;

  constructor(model, options = {}) {
    const {
      syncDirection = SYNC_DIRECTIONS.DO_NOT_SYNC,
      excludedColumns = ['createdAt', 'updatedAt', 'markedForPush', 'markedForSync', 'isPushing'],
      includedRelations = [],
    } = options;

    this.syncDirection = syncDirection;
    this.excludedColumns = excludedColumns;
    this.includedRelations = includedRelations;

    try {
      // validateSync is called that because it's synchronous, it has nothing to do with our sync
      syncConfigOptionsSchema.validateSync(this);
    } catch (e) {
      log.error(
        [`SyncConfig: error validating config for ${model.name}:`, ...e.errors].join('\n - '),
      );
      throw e;
    }
  }
}
