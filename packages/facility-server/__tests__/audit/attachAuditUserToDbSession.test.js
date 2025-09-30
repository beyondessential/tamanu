import config from 'config';
import defineExpress from 'express';
import { QueryTypes } from 'sequelize';
import asyncHandler from 'express-async-handler';
import { agent as _agent } from 'supertest';

import { attachAuditUserToDbSession } from '@tamanu/database';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { fakeUser } from '@tamanu/fake-data/fake';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

import { authMiddleware, buildToken } from '../../app/middleware/auth';
import { createTestContext } from '../utilities';
import bodyParser from 'body-parser';

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
        const { sleep } = req.query;
        await sleepAsync(parseInt(sleep, 10));

        // Update the authenticated user to have a different display name
        const userUpdated = await req.models.User.update(req.body, { where: { id: req.user.id } });
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
    // Stagger the response times of the 4 requests to ensure they are processed in parallel
    await Promise.all([
      userApp1.post('/updateAuthenticatedUser?sleep=4000').send({
        displayName: 'changed',
      }),
      userApp2.post('/updateAuthenticatedUser?sleep=3000').send({
        displayName: 'changed',
      }),
      userApp3.post('/updateAuthenticatedUser?sleep=2000').send({
        displayName: 'changed',
      }),
      userApp4.post('/updateAuthenticatedUser?sleep=1000').send({
        displayName: 'changed',
      }),
    ]);

    // Get the created audit entries for the 4 users that updated their own records
    const changes = await ctx.sequelize.query(
      `SELECT * FROM logs.changes WHERE record_id IN (:userIds) AND record_data->>'display_name' = 'changed'`,
      {
        type: QueryTypes.SELECT,
        replacements: {
          userIds: [user1, user2, user3, user4].map(user => user.id),
        },
      },
    );
    expect(changes).toHaveLength(4);
    // Each user should be shown to have updated their own record in the audit log
    expect(changes.every(change => change.updated_by_user_id === change.record_id)).toBeTruthy();
  });
});
