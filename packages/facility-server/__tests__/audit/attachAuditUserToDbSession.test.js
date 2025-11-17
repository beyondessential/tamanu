import config from 'config';
import defineExpress from 'express';
import { QueryTypes, Sequelize } from 'sequelize';
import asyncHandler from 'express-async-handler';
import { agent as _agent } from 'supertest';

import { attachAuditUserToDbSession } from '@tamanu/database';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { fakeUser } from '@tamanu/fake-data/fake';

import { authMiddleware, buildToken } from '../../app/middleware/auth';
import { createTestContext } from '../utilities';
import bodyParser from 'body-parser';
import { SYSTEM_USER_UUID } from '@tamanu/constants';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

const runWithDelay = async (callbacks, delay = 50) => {
  return await Promise.all(
    callbacks.map(async (callback, index) => {
      await sleepAsync(delay * index);
      return await callback();
    }),
  );
};

describe('Attach audit user to DB session', () => {
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

    // Reduce the max pool size to 2
    ctx = await createTestContext({
      databaseOverrides: {
        pool: {
          max: 2,
          min: 2,
        },
      },
    });
    models = ctx.models;

    await models.Setting.set('audit.changes.enabled', true);

    // Setup a mock express app with a route that updates a user
    // and includes the attachAuditUserToDbSession middleware
    // to set the authenticated user in the sequelize cls async storage context
    const mockApp = defineExpress();
    mockApp.use(bodyParser.json({ limit: '50mb' }));
    mockApp.post(
      '/updateAuthenticatedUser',
      (req, _res, next) => {
        req.models = models;
        req.db = ctx.sequelize;
        req.settings = ctx.settings;
        next();
      },
      authMiddleware,
      attachAuditUserToDbSession,
      asyncHandler(async (req, res) => {
        const userUpdated = await req.models.User.update(
          { displayName: `changed-by-${req.user.id}` },
          { where: { id: req.user.id } },
        );

        res.json(userUpdated);
      }),
    );
    mockApp.post(
      '/updateAuthenticatedUserInTransaction',
      (req, _res, next) => {
        req.models = models;
        req.db = ctx.sequelize;
        req.settings = ctx.settings;
        next();
      },
      authMiddleware,
      attachAuditUserToDbSession,
      asyncHandler(async (req, res) => {
        let userUpdated;
        await req.db.transaction(async () => {
          // Update the authenticated user to have a different display name
          userUpdated = await req.models.User.update(
            { displayName: `changed-by-${req.user.id}` },
            { where: { id: req.user.id } },
          );
        });

        res.json(userUpdated);
      }),
    );
    mockApp.post(
      '/updateAuthenticatedUserInIsolatedTransaction',
      (req, _res, next) => {
        req.models = models;
        req.db = ctx.sequelize;
        req.settings = ctx.settings;
        next();
      },
      authMiddleware,
      attachAuditUserToDbSession,
      asyncHandler(async (req, res) => {
        let userUpdated;
        await req.db.transaction(
          { isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_UNCOMMITTED },
          async () => {
            // Update the authenticated user to have a different display name
            userUpdated = await req.models.User.update(
              { displayName: `changed-by-${req.user.id}` },
              { where: { id: req.user.id } },
            );
          },
        );

        res.json(userUpdated);
      }),
    );

    const asUser = async user => {
      const agent = _agent(mockApp);
      const token = await buildToken({
        user,
        deviceId: ctx.deviceId,
        facilityId: facilityIds[0],
        expiresIn: '1d',
      });
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
    const changeRequests = await runWithDelay([
      () => userApp1.post('/updateAuthenticatedUser'),
      () => userApp2.post('/updateAuthenticatedUserInTransaction'),
      () => userApp3.post('/updateAuthenticatedUserInIsolatedTransaction'),
      () =>
        models.User.update(
          { displayName: `changed-by-${SYSTEM_USER_UUID}` },
          { where: { id: user4.id } },
        ),

      () => userApp4.post('/updateAuthenticatedUserInIsolatedTransaction'),
      () => userApp2.post('/updateAuthenticatedUser'),
      () =>
        models.User.update(
          { displayName: `changed-by-${SYSTEM_USER_UUID}` },
          { where: { id: user3.id } },
        ),
      () => userApp1.post('/updateAuthenticatedUserInTransaction'),

      () => userApp4.post('/updateAuthenticatedUserInTransaction'),
      () =>
        models.User.update(
          { displayName: `changed-by-${SYSTEM_USER_UUID}` },
          { where: { id: user2.id } },
        ),
      () => userApp3.post('/updateAuthenticatedUser'),
      () => userApp1.post('/updateAuthenticatedUserInIsolatedTransaction'),

      () =>
        models.User.update(
          { displayName: `changed-by-${SYSTEM_USER_UUID}` },
          { where: { id: user1.id } },
        ),
      () => userApp2.post('/updateAuthenticatedUserInIsolatedTransaction'),
      () => userApp3.post('/updateAuthenticatedUserInTransaction'),
      () => userApp4.post('/updateAuthenticatedUser'),
    ]);

    // Get the created audit entries
    const changes = await ctx.sequelize.query(
      `SELECT * FROM logs.changes WHERE record_id IN (:userIds) AND record_data->>'display_name' like 'changed-by-%'`,
      {
        type: QueryTypes.SELECT,
        replacements: {
          userIds: [user1, user2, user3, user4].map(user => user.id),
        },
      },
    );
    expect(changes).toHaveLength(changeRequests.length);

    // Each user should be shown to have updated their own record in the audit log
    changes.forEach(change => {
      expect(`changed-by-${change.updated_by_user_id}`).toEqual(change.record_data.display_name);
    });
  });
});
