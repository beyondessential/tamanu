import type { ChangeLog } from 'models/ChangeLog';
import type { Models } from 'types/model';

export const insertChangelogRecords = async (models: Models, changelogRecords: ChangeLog[]) => {
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
    .map((changelogRecord) => ({
      ...changelogRecord,
    }));

  await ChangeLog.bulkCreate(recordsToInsert);
};
