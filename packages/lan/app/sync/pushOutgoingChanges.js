import { calculatePageLimit } from './calculatePageLimit';

export const pushOutgoingChanges = async (centralServer, sessionId, changes) => {
  let startOfPage = 0;
  let limit = calculatePageLimit();
  while (startOfPage < changes.length) {
    const endOfPage = Math.min(startOfPage + limit, changes.length);
    const page = changes.slice(startOfPage, endOfPage);

    const startTime = Date.now();
    await centralServer.push(sessionId, page, {
      pushedSoFar: endOfPage,
      totalToPush: changes.length,
    });
    const endTime = Date.now();

    startOfPage = endOfPage;
    limit = calculatePageLimit(limit, endTime - startTime);
  }
};
