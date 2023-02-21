import { Op } from 'sequelize';
import config from 'config';
import { sleepAsync } from 'shared/utils/sleepAsync';

const checkForSnapshotSlot = async models => {
  // work out how many sessions are currently in the snapshot phase
  const count = await models.SyncSession.count({
    where: {
      pullSince: { [Op.not]: null },
      snapshotCompletedAt: { [Op.is]: null },
    },
  });
  if (count < config.sync.numberConcurrentSnapshots) {
    return true;
  }
};

export const waitForSnapshotSlot = async models => {
  // wait for a gap to appear in the snapshot phase
  while (!(await checkForSnapshotSlot(models))) {
    await sleepAsync(500); // wait for half a second
  }
};
