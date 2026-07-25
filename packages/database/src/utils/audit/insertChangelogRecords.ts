import type { ChangeLog } from 'models/ChangeLog';
import type { Attributes } from 'sequelize';
import type { Models } from 'types/model';

export const insertChangelogRecords = async (
  models: Models,
  changelogRecords: Attributes<ChangeLog>[],
) => {
  const { ChangeLog } = models;

  if (!changelogRecords.length) {
    return;
  }

  await ChangeLog.bulkCreate(changelogRecords, { ignoreDuplicates: true });
};
