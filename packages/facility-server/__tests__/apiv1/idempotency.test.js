import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import config from 'config';
import { IDEMPOTENCY_KEY_STATUSES } from '@tamanu/constants';
import {
  createDummyPatient,
  randomReferenceId,
  randomUser,
} from '@tamanu/database/demoData/patients';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

import { createTestContext } from '../utilities';
import { buildToken } from '../../app/middleware/auth';

// spec: IDEM
// Scenarios from .workhorse/test-cases/w1/overview.md, exercised end-to-end through
// the real facility API so the middleware is tested where it is actually mounted.
//
// `/api/allergy` is the workhorse endpoint here: a small POST that creates exactly
// one row, so "did the handler run again?" is answerable by counting rows.

describe('Request idempotency', () => {
  let ctx;
  let baseApp;
  let models;
  let app;
  let patient;

  const allergyBody = async () => ({
    allergyId: await randomReferenceId(models, 'allergy'),
    patientId: patient.id,
    practitionerId: await randomUser(models),
  });

  const countAllergies = async () => models.PatientAllergy.count({ where: { patientId: patient.id } });

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    patient = await models.Patient.create(await createDummyPatient(models));
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.IdempotencyKey.destroy({ where: {}, force: true });
    await models.PatientAllergy.destroy({ where: { patientId: patient.id }, force: true });
  });

  describe('core behaviour', () => {
    it('records a key and creates the record exactly once', async () => {
      const body = await allergyBody();
      const result = await app.post('/api/allergy').set('Idempotency-Key', 'core-1').send(body);

      expect(result).toHaveSucceeded();
      expect(await countAllergies()).toBe(1);

      const records = await models.IdempotencyKey.findAll({ where: { key: 'core-1' } });
      expect(records).toHaveLength(1);
      expect(records[0].status).toBe(IDEMPOTENCY_KEY_STATUSES.COMPLETED);
      expect(records[0].responseStatus).toBe(result.status);
    });

    it('replays the first response on retry without running the handler again', async () => {
      const body = await allergyBody();
      const first = await app.post('/api/allergy').set('Idempotency-Key', 'core-2').send(body);
      expect(first).toHaveSucceeded();

      const second = await app.post('/api/allergy').set('Idempotency-Key', 'core-2').send(body);

      // Same outcome returned, and the operation ran only once.
      expect(second.status).toBe(first.status);
      expect(second.body).toEqual(first.body);
      expect(await countAllergies()).toBe(1);
      expect(await models.IdempotencyKey.count({ where: { key: 'core-2' } })).toBe(1);
    });

    it('does not intercept a mutating request without a key', async () => {
      const result = await app.post('/api/allergy').send(await allergyBody());

      expect(result).toHaveSucceeded();
      expect(await models.IdempotencyKey.count()).toBe(0);
    });

    it('does not intercept a GET carrying a key', async () => {
      const result = await app.get('/api/patient/' + patient.id).set('Idempotency-Key', 'core-3');

      expect(result).toHaveSucceeded();
      expect(await models.IdempotencyKey.count()).toBe(0);
    });
  });

  describe('failure and retry', () => {
    it('records nothing for a 4xx and lets the same key be retried', async () => {
      const badBody = { allergyId: 'invalid id', patientId: patient.id };

      const first = await app.post('/api/allergy').set('Idempotency-Key', 'fail-1').send(badBody);
      expect(first).toHaveRequestError();

      // Nothing recorded: the claim rolled back with the failed operation.
      expect(await models.IdempotencyKey.count({ where: { key: 'fail-1' } })).toBe(0);

      // The same key is therefore free to carry the corrected request.
      const retry = await app
        .post('/api/allergy')
        .set('Idempotency-Key', 'fail-1')
        .send(await allergyBody());
      expect(retry).toHaveSucceeded();
      expect(await countAllergies()).toBe(1);
    });

    it('rolls the handler writes back when the response is a 4xx', async () => {
      // The allergy insert and the claim share one transaction, so a failing
      // request must leave neither behind.
      const badBody = { allergyId: 'invalid id', patientId: patient.id };
      const result = await app.post('/api/allergy').set('Idempotency-Key', 'fail-2').send(badBody);

      expect(result).toHaveRequestError();
      expect(await countAllergies()).toBe(0);
      expect(await models.IdempotencyKey.count()).toBe(0);
    });
  });

  describe('request binding and scope', () => {
    it('rejects the same key presented with a different request', async () => {
      const body = await allergyBody();
      const first = await app.post('/api/allergy').set('Idempotency-Key', 'bind-1').send(body);
      expect(first).toHaveSucceeded();

      // Same key, different body → different fingerprint.
      const different = await app
        .post('/api/allergy')
        .set('Idempotency-Key', 'bind-1')
        .send(await allergyBody());

      expect(different).toHaveStatus(409);
      // The unrelated response was not replayed, and nothing extra was created.
      expect(different.body).not.toEqual(first.body);
      expect(await countAllergies()).toBe(1);
    });

    it('scopes keys per user', async () => {
      const body = await allergyBody();
      const first = await app.post('/api/allergy').set('Idempotency-Key', 'scope-1').send(body);
      expect(first).toHaveSucceeded();

      const otherUserApp = await baseApp.asRole('practitioner');
      const second = await otherUserApp
        .post('/api/allergy')
        .set('Idempotency-Key', 'scope-1')
        .send(body);

      // A different user's identical key is a different operation, so it runs.
      expect(second).toHaveSucceeded();
      expect(second.body.id).not.toBe(first.body.id);
      expect(await countAllergies()).toBe(2);
      expect(await models.IdempotencyKey.count({ where: { key: 'scope-1' } })).toBe(2);
    });

    it('scopes keys per facility', async () => {
      const facilityIds = selectFacilityIds(config);
      expect(facilityIds.length).toBeGreaterThan(1);

      const body = await allergyBody();
      const first = await app.post('/api/allergy').set('Idempotency-Key', 'scope-2').send(body);
      expect(first).toHaveSucceeded();

      // Same user, same key, but a token scoped to a different facility.
      const otherFacilityAgent = await baseApp.asUser(app.user);
      const token = await buildToken({
        user: app.user,
        deviceId: ctx.deviceId,
        facilityId: facilityIds[1],
        expiresIn: '1d',
      });
      otherFacilityAgent.set('authorization', `Bearer ${token}`);

      const second = await otherFacilityAgent
        .post('/api/allergy')
        .set('Idempotency-Key', 'scope-2')
        .send(body);

      expect(second).toHaveSucceeded();
      expect(second.body.id).not.toBe(first.body.id);
      expect(await models.IdempotencyKey.count({ where: { key: 'scope-2' } })).toBe(2);
    });
  });

  describe('concurrency', () => {
    it('runs the handler once for two concurrent requests with the same key', async () => {
      const body = await allergyBody();

      const [a, b] = await Promise.all([
        app.post('/api/allergy').set('Idempotency-Key', 'conc-1').send(body),
        app.post('/api/allergy').set('Idempotency-Key', 'conc-1').send(body),
      ]);

      // Exactly one execution, one row, one key.
      expect(await countAllergies()).toBe(1);
      expect(await models.IdempotencyKey.count({ where: { key: 'conc-1' } })).toBe(1);

      // One request succeeded outright. The other either replayed that outcome or
      // was told the first was still in flight — both are correct, and neither
      // duplicates the operation.
      const statuses = [a.status, b.status].sort();
      const succeeded = [a, b].filter(r => r.status < 400);
      expect(succeeded.length).toBeGreaterThanOrEqual(1);
      expect(statuses.every(s => s < 400 || s === 409)).toBe(true);
    });
  });

  describe('scope exclusions', () => {
    it('does not record a key for an excluded sync endpoint', async () => {
      await app.post('/api/sync/run').set('Idempotency-Key', 'excl-1').send({});

      expect(await models.IdempotencyKey.count({ where: { key: 'excl-1' } })).toBe(0);
    });

    it('does not record a key for the token-issuing endpoints', async () => {
      await app.post('/api/refresh').set('Idempotency-Key', 'excl-2').send({});
      await app.post('/api/setFacility').set('Idempotency-Key', 'excl-3').send({});

      expect(await models.IdempotencyKey.count()).toBe(0);
    });
  });

  describe('store and lifecycle', () => {
    it('does not sync idempotency keys', () => {
      expect(models.IdempotencyKey.syncDirection).toBe('do_not_sync');
    });

    it('keeps recorded response bodies out of the change log', async () => {
      await app
        .post('/api/allergy')
        .set('Idempotency-Key', 'store-1')
        .send(await allergyBody());

      const [{ count }] = await ctx.sequelize.query(
        `SELECT COUNT(*)::int AS count FROM logs.changes WHERE table_name = 'idempotency_keys'`,
        { type: ctx.sequelize.QueryTypes.SELECT },
      );
      expect(count).toBe(0);
    });
  });
});
