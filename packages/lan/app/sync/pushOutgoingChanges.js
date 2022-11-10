import { withConfig } from 'shared/utils/withConfig';

import { calculatePageLimit } from './calculatePageLimit';

export const pushOutgoingChanges = withConfig(async (centralServer, sessionId, changes, config) => {
  let startOfPage = 0;
  let limit = calculatePageLimit.overrideConfig(null, null, config);
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
    limit = calculatePageLimit.overrideConfig(limit, endTime - startTime, config);
  }
});
