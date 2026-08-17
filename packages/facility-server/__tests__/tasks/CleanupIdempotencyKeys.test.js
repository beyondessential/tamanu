import { IDEMPOTENCY_KEY_STATUSES } from '@tamanu/constants';

import { createTestContext } from '../utilities';
import { CleanupIdempotencyKeys } from '../../app/tasks/CleanupIdempotencyKeys';

// spec: IDEM
// Retention: recorded keys are useful only for as long as a client might retry,
// so the table must not grow without bound.

describe('CleanupIdempotencyKeys', () => {
  let ctx;
  let models;
  let user;
  let facilityId;

  const createKey = async (key, expiresAt) =>
    models.IdempotencyKey.create({
      key,
      userId: user.id,
      facilityId,
      method: 'POST',
      path: '/allergy',
      requestHash: `hash-${key}`,
      status: IDEMPOTENCY_KEY_STATUSES.COMPLETED,
      responseStatus: 200,
      responseBody: { ok: true },
      claimedAt: new Date(),
      completedAt: new Date(),
      expiresAt,
    });

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    [user] = await models.User.findAll({ limit: 1 });
    const [facility] = await models.Facility.findAll({ limit: 1 });
    facilityId = facility.id;
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.IdempotencyKey.destroy({ where: {}, force: true });
  });

  it('removes expired keys and keeps unexpired ones', async () => {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const hourAhead = new Date(Date.now() + 60 * 60 * 1000);
    await createKey('expired-1', hourAgo);
    await createKey('expired-2', hourAgo);
    await createKey('live-1', hourAhead);

    await new CleanupIdempotencyKeys(ctx).run();

    const remaining = await models.IdempotencyKey.findAll({ paranoid: false });
    expect(remaining.map(r => r.key)).toEqual(['live-1']);
  });

  it('is a no-op when nothing has expired', async () => {
    await createKey('live-2', new Date(Date.now() + 60 * 60 * 1000));

    await new CleanupIdempotencyKeys(ctx).run();

    expect(await models.IdempotencyKey.count({ paranoid: false })).toBe(1);
  });

  it('takes its schedule from settings like the other scheduled tasks', () => {
    // Guards the config-vs-settings split: a task reading `config.schedules`
    // would not be admin-editable and would throw here.
    const task = new CleanupIdempotencyKeys(ctx);
    expect(task.getName()).toBe('CleanupIdempotencyKeys');
    expect(ctx.schedules.cleanupIdempotencyKeys).toBeTruthy();
  });
});
