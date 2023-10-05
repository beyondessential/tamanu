import { calculatePageLimit } from './calculatePageLimit';

export const pushOutgoingChanges = async (syncManager, sessionId, changes) => {
  let startOfPage = 0;
  let limit = calculatePageLimit();
  while (startOfPage < changes.length) {
    const endOfPage = Math.min(startOfPage + limit, changes.length);
    const page = changes.slice(startOfPage, endOfPage);

    const startTime = Date.now();
    await syncManager.push(sessionId, page);
    const endTime = Date.now();

    startOfPage = endOfPage;
    limit = calculatePageLimit(limit, endTime - startTime);
  }
  await syncManager.completePush(sessionId);
};
