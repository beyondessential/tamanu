import config from 'config';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { Op, Sequelize } from 'sequelize';

import type { ChangelogRecord } from 'types/sync';

export const insertChangelogRecords = async (
  sequelize: Sequelize,
  changelogRecords: ChangelogRecord[],
  isFacility = !!selectFacilityIds(config),
) => {
  if (!changelogRecords.length) {
    return;
  }
  const queryInterface = sequelize.getQueryInterface();

  const existingRecords = (await queryInterface.select(
    null,
    { tableName: 'changes', schema: 'logs' },
    {
      where: {
        id: {
          [Op.in]: changelogRecords.map(({ id }) => id),
        },
      },
    },
  )) as ChangelogRecord[];

  const existingIds = existingRecords.map(({ id }) => id);
  const recordsToInsert = changelogRecords
    .filter(({ id }) => !existingIds.includes(id))
    .map(({ record_data, updated_at_sync_tick, ...changelogRecord }) => {
      return {
        ...changelogRecord,
        // TODO Should we he have to do this ?
        updated_at_sync_tick: isFacility ? -999 : Number(updated_at_sync_tick),
        record_data: JSON.stringify(record_data),
      };
    });
  await queryInterface.bulkInsert({ tableName: 'changes', schema: 'logs' }, recordsToInsert);
};
