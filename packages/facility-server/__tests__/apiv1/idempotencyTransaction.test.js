import { Op } from 'sequelize';
import express from 'express';
import supertest from 'supertest';
import asyncHandler from 'express-async-handler';

import { IDEMPOTENCY_KEY_STATUSES } from '@tamanu/constants';
import { createRequestIdempotencyMiddleware } from '@tamanu/database/utils/requestIdempotency';

import { createTestContext } from '../utilities';

// spec: IDEM
//
// Transaction integrity. The design rests on a premise that cannot be checked by
// reading the code: that a handler's own writes enrol in the transaction this
// middleware opened, via Sequelize's CLS binding, even though the handler is
// reached through `next()` and knows nothing about it.
//
// These use a purpose-built app rather than the real API so the handler can do
// exactly what each case needs — write and then fail, throw, or open its own
// transaction — which no real endpoint does on demand.

describe('Request idempotency transaction integrity', () => {
  let ctx;
  let models;
  let app;
  let user;
  let facilityId;

  const factKey = name => `w1-test-${name}`;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    [user] = await models.User.findAll({ limit: 1 });
    const [facility] = await models.Facility.findAll({ limit: 1 });
    facilityId = facility.id;

    const testApp = express();
    testApp.use(express.json());
    testApp.use((req, res, next) => {
      req.models = models;
      req.db = ctx.sequelize;
      req.user = user;
      req.facilityId = facilityId;
      next();
    });
    testApp.use(createRequestIdempotencyMiddleware());

    // Writes a row, then succeeds.
    testApp.post(
      '/write',
      asyncHandler(async (req, res) => {
        await models.LocalSystemFact.create({ key: factKey(req.body.name), value: 'written' });
        res.send({ wrote: req.body.name });
      }),
    );

    // Writes a row, then fails — the write must not survive.
    testApp.post(
      '/write-then-fail',
      asyncHandler(async (req, res) => {
        await models.LocalSystemFact.create({ key: factKey(req.body.name), value: 'written' });
        res.status(422).send({ error: { message: 'refused after writing' } });
      }),
    );

    // Writes a row, then throws — same requirement, via the error path.
    testApp.post(
      '/write-then-throw',
      asyncHandler(async req => {
        await models.LocalSystemFact.create({ key: factKey(req.body.name), value: 'written' });
        throw new Error('handler exploded');
      }),
    );

    // Opens its own managed transaction, which should nest as a savepoint.
    testApp.post(
      '/nested-transaction',
      asyncHandler(async (req, res) => {
        await ctx.sequelize.transaction(async () => {
          await models.LocalSystemFact.create({ key: factKey(req.body.name), value: 'nested' });
        });
        res.send({ wrote: req.body.name });
      }),
    );

    // eslint-disable-next-line no-unused-vars
    testApp.use((err, req, res, _next) => {
      res.status(500).send({ error: { message: err.message } });
    });

    app = supertest(testApp);
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.IdempotencyKey.destroy({ where: {}, force: true });
    // Only this suite's rows: the table also holds facts the server needs, such
    // as the facility ids and the sync tick.
    await models.LocalSystemFact.destroy({
      where: { key: { [Op.like]: 'w1-test-%' } },
      force: true,
    });
  });

  const factExists = async name =>
    (await models.LocalSystemFact.count({ where: { key: factKey(name) } })) > 0;

  it("enrols the handler's writes in the middleware transaction", async () => {
    const result = await app.post('/write').set('Idempotency-Key', 'txn-1').send({ name: 'a' });

    expect(result).toHaveSucceeded();
    expect(await factExists('a')).toBe(true);

    // Committed together: the key records the same outcome the client received.
    const record = await models.IdempotencyKey.findOne({ where: { key: 'txn-1' } });
    expect(record.status).toBe(IDEMPOTENCY_KEY_STATUSES.COMPLETED);
    expect(record.responseBody).toEqual({ wrote: 'a' });
  });

  it('rolls back a write the handler made before returning a 4xx', async () => {
    // The proof of CLS propagation: the handler never opted in, yet its write is
    // undone with the middleware's transaction.
    const result = await app
      .post('/write-then-fail')
      .set('Idempotency-Key', 'txn-2')
      .send({ name: 'b' });

    expect(result).toHaveStatus(422);
    expect(result.body.error.message).toBe('refused after writing');
    expect(await factExists('b')).toBe(false);
    expect(await models.IdempotencyKey.count({ where: { key: 'txn-2' } })).toBe(0);
  });

  it('rolls back and records nothing when the handler throws', async () => {
    const result = await app
      .post('/write-then-throw')
      .set('Idempotency-Key', 'txn-3')
      .send({ name: 'c' });

    expect(result).toHaveStatus(500);
    expect(await factExists('c')).toBe(false);
    // Nothing recorded, so the operation stays retryable.
    expect(await models.IdempotencyKey.count({ where: { key: 'txn-3' } })).toBe(0);
  });

  it('leaves a failed operation retryable under the same key', async () => {
    await app.post('/write-then-throw').set('Idempotency-Key', 'txn-4').send({ name: 'd' });

    const retry = await app.post('/write').set('Idempotency-Key', 'txn-4').send({ name: 'd' });

    expect(retry).toHaveSucceeded();
    expect(await factExists('d')).toBe(true);
  });

  it("commits atomically with a handler's own managed transaction", async () => {
    const result = await app
      .post('/nested-transaction')
      .set('Idempotency-Key', 'txn-5')
      .send({ name: 'e' });

    expect(result).toHaveSucceeded();
    expect(await factExists('e')).toBe(true);
    expect(await models.IdempotencyKey.count({ where: { key: 'txn-5' } })).toBe(1);
  });

  it('replays a recorded response without re-running the handler', async () => {
    const first = await app.post('/write').set('Idempotency-Key', 'txn-6').send({ name: 'f' });
    expect(first).toHaveSucceeded();

    const replay = await app.post('/write').set('Idempotency-Key', 'txn-6').send({ name: 'f' });

    expect(replay.status).toBe(first.status);
    expect(replay.body).toEqual(first.body);
    // The handler would have thrown a unique-key error had it run again.
    expect(await models.LocalSystemFact.count({ where: { key: factKey('f') } })).toBe(1);
  });
});
