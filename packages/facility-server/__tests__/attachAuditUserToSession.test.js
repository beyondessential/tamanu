import config from 'config';
import defineExpress from 'express';
import { QueryTypes } from 'sequelize';
import asyncHandler from 'express-async-handler';
import { agent as _agent } from 'supertest';

import { attachAuditUserToDbSession } from '@tamanu/database';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { fakeUser } from '@tamanu/shared/test-helpers/fake';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

import { authMiddleware, buildToken } from '../app/middleware/auth';
import { createTestContext } from './utilities';

const reducedPoolConfig = {
  pool: {
    max: 2,
    min: 2,
  },
};

describe('attachAuditUserToSession', () => {
  let ctx;
  let user1;
  let user2;
  let user3;
  let user4;
  let userApp1;
  let userApp2;
  let userApp3;
  let userApp4;
  let models;
  beforeAll(async () => {
    const facilityIds = selectFacilityIds(config);

    ctx = await createTestContext({ databaseOverrides: reducedPoolConfig });
    models = ctx.models;

    // Setup a mock express app with a route that updates a user
    const mockApp = defineExpress();
    mockApp.get(
      '/test',
      (req, _res, next) => {
        req.models = models;
        req.db = ctx.sequelize;
        next();
      },
      authMiddleware,
      attachAuditUserToDbSession,
      asyncHandler(async (req, res) => {
        // Stagger the response time to simulate overlapping requests
        await sleepAsync( {
          [user1.id]: 4000,
          [user2.id]: 3000,
          [user3.id]: 2000,
          [user4.id]: 1000,
        }[req.user.id]);

        // Update the authenticated user to have a different display name
        const userUpdated = await req.models.User.update(
          { displayName: 'changed' },
          { where: { id: req.user.id } },
        );
        res.json(userUpdated);
      }),
    );

    const asUser = async (user) => {
      const agent = _agent(mockApp);
      const token = await buildToken(user, facilityIds[0], '1d');
      agent.set('authorization', `Bearer ${token}`);
      agent.user = user;
      return agent;
    };
    // Create 4 users to simulate different users making simultaneous requests
    // this is explicitly 2+ the max pool connections
    [user1, user2, user3, user4] = await models.User.bulkCreate([
      { ...fakeUser(), role: 'practitioner' },
      { ...fakeUser(), role: 'practitioner' },
      { ...fakeUser(), role: 'practitioner' },
      { ...fakeUser(), role: 'practitioner' },
    ]);
    userApp1 = await asUser(user1);
    userApp2 = await asUser(user2);
    userApp3 = await asUser(user3);
    userApp4 = await asUser(user4);
  });

  afterAll(() => ctx.close());

  it('audit log updated_by_user_id should match authenticated user with multiple simultaneous requests', async () => {
    await Promise.all([
      userApp1.get('/test'),
      userApp2.get('/test'),
      userApp3.get('/test'),
      userApp4.get('/test'),
    ]);

    const changes = await ctx.sequelize.query(
      `SELECT * FROM logs.changes where record_id in (:userIds) and record_data->>'display_name' = 'changed'`,
      {
        type: QueryTypes.SELECT,
        replacements: {
          userIds: [user1, user2, user3, user4].map((user) => user.id),
        },
      },
    );
    expect(changes).toHaveLength(4);
    // Each user should be shown to have updated their own record in the audit log
    expect(changes.every((change) => change.updated_by_user_id === change.record_id)).toBeTruthy();
  });
});
