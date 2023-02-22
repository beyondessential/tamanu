import { Op } from 'sequelize';
import config from 'config';
import { sleepAsync } from 'shared/utils/sleepAsync';

const checkForConcurrentSnapshotCapacity = async models => {
  // work out how many sessions are currently in the snapshot phase
  const count = await models.SyncSession.count({
    where: {
      pullSince: { [Op.not]: null },
      snapshotCompletedAt: { [Op.is]: null },
    },
  });
  return count < config.sync.numberConcurrentPullSnapshots;
};

export const waitForConcurrentSnapshotCapacity = async models => {
  // wait for there to be enough capacity to start a snapshot
  while (!(await checkForConcurrentSnapshotCapacity(models))) {
    await sleepAsync(500); // wait for half a second
  }
};
