import { calculatePageLimit } from './calculatePageLimit';

export const pushOutgoingChanges = async (centralServer, sessionId, changes) => {
  let startOfPage = 0;
  const dynamicLimiter = await centralServer.settings.get('sync.dynamicLimiter');
  let limit = calculatePageLimit(dynamicLimiter);
  while (startOfPage < changes.length) {
    const endOfPage = Math.min(startOfPage + limit, changes.length);
    const page = changes.slice(startOfPage, endOfPage);

    const startTime = Date.now();
    await centralServer.push(sessionId, page);
    const endTime = Date.now();

    startOfPage = endOfPage;
    limit = calculatePageLimit(dynamicLimiter, limit, endTime - startTime);
  }
  await centralServer.completePush(sessionId);
};
