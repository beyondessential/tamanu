import { describe, expect, it, jest } from '@jest/globals';

import { pullIncomingChanges } from '../../app/sync/pullIncomingChanges';

describe('pullIncomingChanges', () => {
  it('completes cleanly when the central server returns an empty page', async () => {
    // central server reports records to pull, but the pull query returns an empty page
    // (reachable when totalToPull diverges from the dependency-ordered pull query)
    const centralServer = {
      initiatePull: jest.fn().mockResolvedValue({ totalToPull: 10, pullUntil: 42 }),
      pull: jest.fn().mockResolvedValue([]),
    };
    const sequelize = {};

    const result = await pullIncomingChanges(centralServer, sequelize, 'sessionId', 1);

    expect(centralServer.pull).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ totalPulled: 10, pullUntil: 42 });
  });
});
