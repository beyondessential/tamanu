import { Op } from 'sequelize';

export const insertChangelogRecords = async (sequelize, changelogRecords) => {
  if (!changelogRecords.length) {
    return;
  }
  const queryInterface = sequelize.getQueryInterface();

  // filter out records that already exist based on record type and id
  const existingRecords = await queryInterface.select(
    null,
    { tableName: 'changes', schema: 'logs' },
    {
      where: {
        [Op.or]: changelogRecords.map((r) => ({
          table_name: r.table_name,
          record_id: r.record_id,
        })),
      },
    },
  );
  const existingKeys = existingRecords.map((r) => `${r.table_name}-${r.record_id}`);
  const recordsToInsert = changelogRecords
    .filter((r) => !existingKeys.includes(`${r.table_name}-${r.record_id}`))
    .map((r) => ({
      ...r,
      updated_at_sync_tick: -999, // match incoming record behaviour so this doesn't sync back to the central server
    }));
  await queryInterface.bulkInsert(
    { tableName: { tableName: 'changes', schema: 'logs' } },
    recordsToInsert,
  );
};
