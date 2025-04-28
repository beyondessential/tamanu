import { Op, Sequelize } from 'sequelize';
import config from 'config';

import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import type { ChangelogRecord } from 'types/sync';

export const insertChangelogRecords = async (
  sequelize: Sequelize,
  changelogRecords: ChangelogRecord[],
) => {
  // TODO AUDIT: what to do here do we need this
  const isFacility = !!selectFacilityIds(config);
  if (!changelogRecords.length) {
    return;
  }
  const queryInterface = sequelize.getQueryInterface();

  // filter out records that already exist based on record type and id
  const existingRecords = (await queryInterface.select(
    null,
    { tableName: 'changes', schema: 'logs' },
    {
      where: {
        [Op.or]: changelogRecords.map(({ table_name, record_id }) => ({
          table_name,
          record_id,
        })),
      },
    },
  )) as ChangelogRecord[];

  const existingKeys = existingRecords.map((r) => `${r.table_name}-${r.record_id}`);
  const recordsToInsert = changelogRecords.filter(
    (r) => !existingKeys.includes(`${r.table_name}-${r.record_id}`),
  ).map((r) => {
    return {
      ...r,
      // TODO Should we he have to do this ?
      record_data: JSON.stringify(r.record_data),
      updated_at_sync_tick: Number(r.updated_at_sync_tick),
    }
  });
  await queryInterface.bulkInsert(
    { tableName: 'changes', schema: 'logs' },
    isFacility
      ? recordsToInsert.map((r) => ({
          ...r,
          updated_at_sync_tick: -999, // match incoming record behaviour so this doesn't sync back to the central server
        }))
      : recordsToInsert,
  );
};
