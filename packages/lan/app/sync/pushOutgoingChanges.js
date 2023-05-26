import { calculatePageLimit } from './calculatePageLimit';

// This is only used for jest tests. It is a workaround to spies not working
// with importing modules in the way that this module is used. See the
// FacilitySyncManager.test.js ('edge cases' suite) or SAV-249
let __testSpyEnabled = false;
export const __testOnlyPushOutGoingChangesSpy = [];
export const __testOnlyEnableSpy = () => {
  __testSpyEnabled = true;
};

export const pushOutgoingChanges = async (centralServer, sessionId, changes) => {
  if (__testSpyEnabled) {
    __testOnlyPushOutGoingChangesSpy.push({ centralServer, sessionId, changes });
  }

  let startOfPage = 0;
  let limit = calculatePageLimit();
  while (startOfPage < changes.length) {
    const endOfPage = Math.min(startOfPage + limit, changes.length);
    const page = changes.slice(startOfPage, endOfPage);

    const startTime = Date.now();
    await centralServer.push(sessionId, page);
    const endTime = Date.now();

    startOfPage = endOfPage;
    limit = calculatePageLimit(limit, endTime - startTime);
  }
  await centralServer.completePush(sessionId);
};
