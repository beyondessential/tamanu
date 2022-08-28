import { lowerFirst } from 'lodash';
import * as yup from 'yup';
import { log } from 'shared/services/logging';
import { SYNC_DIRECTIONS, SYNC_DIRECTIONS_VALUES } from 'shared/constants';
import { ChannelRouteConfig, channelRouteConfigSchema } from './ChannelRouteConfig';
import { isTruthy, func } from './schemaUtils';

const syncConfigOptionsSchema = yup.object({
  // whether a model should be pushed to the server, pulled from the server, or both
  syncDirection: yup
    .string()
    .oneOf(SYNC_DIRECTIONS_VALUES)
    .required(),
  // list of columns to exclude when syncing
  excludedColumns: yup.array(yup.string()).test(isTruthy),
  // list of relations to include when syncing, may be deeply nested
  // e.g. ['labRequests', 'labRequests.tests']
  includedRelations: yup.array(yup.string()).test(isTruthy),
  // returns one or more channels to push to
  getChannels: func().required(),
  // list of channel routes, e.g. handlers for different channels
  channelRoutes: yup.array(channelRouteConfigSchema).test(isTruthy),
  // whether to restore a deleted record when receiving a sync record for it
  undeleteOnUpdate: yup.boolean(),
});

export class SyncConfig {
  syncDirection;

  excludedColumns;

  includedRelations;

  getChannels;

  channelRoutes;

  constructor(model, options = {}) {
    const {
      syncDirection = SYNC_DIRECTIONS.DO_NOT_SYNC,
      excludedColumns = ['createdAt', 'updatedAt', 'markedForPush', 'markedForSync', 'isPushing'],
      includedRelations = [],
      getChannels = () => [lowerFirst(model.name)],
      channelRoutes = [{ route: lowerFirst(model.name) }],
      undeleteOnUpdate = false,
    } = options;

    this.syncDirection = syncDirection;
    this.excludedColumns = excludedColumns;
    this.includedRelations = includedRelations;
    this.getChannels = getChannels;
    this.undeleteOnUpdate = undeleteOnUpdate;

    // merge channel route config
    this.channelRoutes = channelRoutes.map(
      channelRouteOptions => new ChannelRouteConfig(model, channelRouteOptions),
    );

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
