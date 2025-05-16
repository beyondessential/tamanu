import config from 'config';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import type { ChangeLog } from 'models/ChangeLog';
import type { Models } from 'types/model';
import { SYNC_TICK_FLAGS } from '../../sync/constants';

export const insertChangelogRecords = async (
  models: Models,
  changelogRecords: ChangeLog[],
  isFacility = !!selectFacilityIds(config),
) => {
  const { ChangeLog } = models;

  if (!changelogRecords.length) {
    return;
  }

  const existingRecords = await ChangeLog.findAll({
    where: {
      id: changelogRecords.map(({ id }) => id),
    },
  });

  const existingIds = existingRecords.map(({ id }) => id);
  const recordsToInsert = changelogRecords
    .filter(({ id }) => !existingIds.includes(id))
    .map(({ recordSyncTick, ...changelogRecord }) => {
      return {
        ...changelogRecord,
        recordSyncTick: isFacility ? SYNC_TICK_FLAGS.LAST_UPDATED_ELSEWHERE : Number(recordSyncTick),
      };
    });

  await ChangeLog.bulkCreate(recordsToInsert);
};
