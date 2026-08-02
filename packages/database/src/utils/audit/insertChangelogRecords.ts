import type { ChangeLog } from 'models/ChangeLog';
import type { Models } from 'types/model';

export const insertChangelogRecords = async (models: Models, changelogRecords: ChangeLog[]) => {
  const { ChangeLog } = models;

  if (!changelogRecords.length) {
    return;
  }

  // Entries are immutable, so a re-delivered batch is skipped rather than merged.
  await ChangeLog.bulkCreate(changelogRecords, { ignoreDuplicates: true });
};
