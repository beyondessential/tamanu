import config from 'config';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import type { ChangeLog } from 'models/ChangeLog';
import type { Models } from 'types/model';

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
    .map(({ recordData, recordSyncTick, ...changelogRecord }) => {
      return {
        ...changelogRecord,
        // TODO Should we he have to do this ?
        recordSyncTick: isFacility ? -999 : Number(recordSyncTick),
        recordData: JSON.stringify(recordData),
      };
    });

  await ChangeLog.bulkCreate(recordsToInsert);
};
