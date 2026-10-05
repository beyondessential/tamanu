import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';

import { fake } from '@tamanu/fake-data/fake';
import {
  BLOB_AVAILABILITY_STATES,
  BLOB_INTEGRITY_STATES,
  BLOB_OFFER_STATUSES,
  BLOB_SCAN_VERDICTS,
  DEVICE_SCOPES,
} from '@tamanu/constants';

import { registerBlobReferenceSource } from '../app/blobReferences';
import { CentralSyncManager } from '../app/sync/CentralSyncManager';
import { createTestContext } from './utilities';

const hashOf = content => `sha256:${createHash('sha256').update(content).digest('hex')}`;

const HELLO = Buffer.from('hello world');
const HELLO_HASH = hashOf(HELLO);
const EMPTY_HASH = hashOf(Buffer.alloc(0));

describe('Blob transfer channel', () => {
  let ctx;
  let baseApp;
  let models;
  let unregisterTestSource;
  let homeFacility;
  let defaultFacilityIds;

  const asDeviceWithScopes = async (deviceId, scopes, { facilityId } = {}) => {
    const user = await models.User.create(fake(models.User, { password: 'password' }));
    if (facilityId) {
      await models.UserFacility.create(
        fake(models.UserFacility, { userId: user.id, facilityId }),
      );
    }
    await models.Device.create(
      fake(models.Device, { id: deviceId, registeredById: user.id, scopes }),
    );
    const login = await baseApp.post('/api/login').send({
      email: user.email,
      password: 'password',
      deviceId,
      scopes,
    });
    expect(login).toHaveSucceeded();
    return { token: login.body.token };
  };

  const asSyncDevice = (deviceId, opts = {}) =>
    asDeviceWithScopes(deviceId, [DEVICE_SCOPES.SYNC_CLIENT], opts);

  const authed = (request, token) => request.set('authorization', `Bearer ${token}`);

  let token;

  const offer = (hash, size, { token: asToken = token, facilityIds = defaultFacilityIds } = {}) =>
    authed(baseApp.post(`/api/blob/${encodeURIComponent(hash)}/offer`), asToken)
      .query({ facilityIds })
      .send({ size });

  const putChunk = (
    hash,
    chunk,
    offset,
    totalSize,
    { token: asToken = token, facilityIds = defaultFacilityIds } = {},
  ) =>
    authed(baseApp.put(`/api/blob/${encodeURIComponent(hash)}/content`), asToken)
      .query({ offset, totalSize, facilityIds })
      .set('content-type', 'application/octet-stream')
      .send(chunk);

  const availability = (hash, { token: asToken = token, facilityIds = defaultFacilityIds } = {}) =>
    authed(baseApp.get(`/api/blob/${encodeURIComponent(hash)}/availability`), asToken).query({
      facilityIds,
    });

  const getBlob = (hash, { token: asToken = token, facilityIds = defaultFacilityIds } = {}) =>
    authed(baseApp.get(`/api/blob/${encodeURIComponent(hash)}`), asToken).query({ facilityIds });

  // spec: BLAC
  // The scratch reference table stands in for the consumer tables. A reference with neither patient
  // nor facility is in scope for any server.
  let referenceSeq = 0;
  const reference = async (hash, { patientId = null, facilityId = null } = {}) => {
    const recordId = `blob-ref-${referenceSeq++}`;
    await ctx.store.sequelize.query(
      'INSERT INTO test_blob_references (id, blob_hash) VALUES (:recordId, :hash)',
      { replacements: { recordId, hash } },
    );
    await ctx.store.sequelize.query(
      `INSERT INTO sync_lookup
        (record_id, record_type, data, updated_at_sync_tick, patient_id, facility_id, is_lab_request, is_deleted)
       VALUES (:recordId, 'test_blob_references', '{}', 1, :patientId, :facilityId, FALSE, FALSE)`,
      { replacements: { recordId, patientId, facilityId } },
    );
    return recordId;
  };

  const dereference = async recordId => {
    await ctx.store.sequelize.query(
      `DELETE FROM sync_lookup WHERE record_type = 'test_blob_references' AND record_id = :recordId`,
      { replacements: { recordId } },
    );
  };

  const seedHeldBlob = async content => (await ctx.blobStore.put(Readable.from(content))).hash;

  const storedPath = hash => {
    const digest = hash.split(':')[1];
    return path.join(
      ctx.blobStore.root,
      'sha256',
      digest.slice(0, 2),
      digest.slice(2, 4),
      digest.slice(4),
    );
  };

  // The stack is a debug field production bodies exclude, and the one allowed to vary.
  const withHashRedacted = (body, hash) => {
    const rest = { ...body };
    delete rest.stack;
    return JSON.parse(JSON.stringify(rest).replaceAll(hash, '<hash>'));
  };

  const pushWhole = async (hash, content) => {
    await reference(hash);
    const offered = await offer(hash, content.length);
    expect(offered).toHaveSucceeded();
    const put = await putChunk(hash, content, 0, content.length);
    expect(put).toHaveSucceeded();
    expect(put.body.acknowledged).toBe(true);
    return put;
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
    await ctx.store.sequelize.query(
      'CREATE TABLE test_blob_references (id TEXT PRIMARY KEY, blob_hash TEXT NOT NULL)',
    );
    unregisterTestSource = registerBlobReferenceSource({
      recordType: 'test_blob_references',
      hashColumn: 'blob_hash',
    });
    homeFacility = await models.Facility.create(fake(models.Facility));
    defaultFacilityIds = [homeFacility.id];
    ({ token } = await asSyncDevice('blob-transfer-test-device', {
      facilityId: homeFacility.id,
    }));
  });

  afterAll(async () => {
    unregisterTestSource();
    await ctx.store.sequelize.query('DROP TABLE IF EXISTS test_blob_references');
    await ctx.close();
  });

  describe('authorisation', () => {
    // Built one at a time rather than opening a batch of pending supertest requests.
    const operations = () => [
      () => baseApp.get(`/api/blob/${encodeURIComponent(HELLO_HASH)}/availability`),
      () => baseApp.get(`/api/blob/${encodeURIComponent(HELLO_HASH)}`),
      () => baseApp.post(`/api/blob/${encodeURIComponent(HELLO_HASH)}/offer`).send({ size: 1 }),
      () =>
        baseApp
          .put(`/api/blob/${encodeURIComponent(HELLO_HASH)}/content`)
          .query({ offset: 0, totalSize: 1 })
          .set('content-type', 'application/octet-stream')
          .send(Buffer.from('x')),
    ];

    it('rejects unauthenticated requests to every operation', async () => {
      for (const makeRequest of operations()) {
        const response = await makeRequest();
        expect(response).toHaveRequestError();
      }
    });

    it('rejects an authenticated user with no device', async () => {
      // A webapp token carries no device, so the missing-device guard fires first.
      const agent = await baseApp.asRole('practitioner');
      const response = await agent.get(
        `/api/blob/${encodeURIComponent(HELLO_HASH)}/availability`,
      );
      expect(response).toHaveRequestError();
    });

    it('rejects an authenticated user whose device lacks the sync-client scope, on every operation', async () => {
      // The device is present, so the SYNC_CLIENT scope assertion is what rejects.
      const { token: unscopedToken } = await asDeviceWithScopes('blob-transfer-unscoped-device', []);
      for (const makeRequest of operations()) {
        const response = await authed(makeRequest(), unscopedToken);
        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });

    it('refuses a sync-client request that declares no facilities', async () => {
      const response = await authed(
        baseApp.get(`/api/blob/${encodeURIComponent(HELLO_HASH)}/availability`),
        token,
      );
      expect(response.status).toBe(403);
    });
  });

  describe('availability', () => {
    it('reports a hash it does not hold as awaiting upload', async () => {
      const hash = hashOf('availability-absent');
      const response = await availability(hash);
      expect(response).toHaveSucceeded();
      expect(response.body).toEqual({ availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD });
    });

    it('reports a held hash as available with its size', async () => {
      const content = Buffer.from('availability-held');
      await pushWhole(hashOf(content), content);

      const response = await availability(hashOf(content));
      expect(response).toHaveSucceeded();
      expect(response.body).toEqual({
        availability: BLOB_AVAILABILITY_STATES.AVAILABLE,
        size: content.length,
      });
    });

    it('rejects a malformed hash', async () => {
      const response = await authed(baseApp.get('/api/blob/not-a-hash/availability'), token).query({
        facilityIds: defaultFacilityIds,
      });
      expect(response).toHaveRequestError();
    });
  });

  describe('push', () => {
    it('accepts an offered blob in offset-addressed chunks and acknowledges once verified', async () => {
      const content = Buffer.from('pushed across two chunks');
      const hash = hashOf(content);
      await reference(hash);

      const offered = await offer(hash, content.length);
      expect(offered.body).toEqual({ status: BLOB_OFFER_STATUSES.WANTED, receivedBytes: 0 });

      const first = await putChunk(hash, content.subarray(0, 10), 0, content.length);
      expect(first).toHaveSucceeded();
      expect(first.body).toEqual({ acknowledged: false, receivedBytes: 10 });

      const reoffered = await offer(hash, content.length);
      expect(reoffered.body).toEqual({ status: BLOB_OFFER_STATUSES.WANTED, receivedBytes: 10 });

      const second = await putChunk(hash, content.subarray(10), 10, content.length);
      expect(second).toHaveSucceeded();
      expect(second.body).toEqual({ acknowledged: true, existed: false, size: content.length });

      const row = await models.Blob.findOne({ where: { hash } });
      expect(row).toMatchObject({ size: content.length, integrityState: 'verified' });
    });

    it('skips the byte transfer for content it already holds', async () => {
      const content = Buffer.from('push idempotency');
      const hash = hashOf(content);
      await pushWhole(hash, content);

      const reoffered = await offer(hash, content.length);
      expect(reoffered.body).toEqual({ status: BLOB_OFFER_STATUSES.ALREADY_STORED });

      const rePut = await putChunk(hash, content, 0, content.length);
      expect(rePut).toHaveSucceeded();
      expect(rePut.body).toEqual({ acknowledged: true, existed: true });
    });

    it('rejects delivered content that does not hash to the offered hash, discarding it', async () => {
      const claimed = hashOf('the real content');
      const wrong = Buffer.from('not the real content');
      await reference(claimed);

      await offer(claimed, wrong.length);
      const put = await putChunk(claimed, wrong, 0, wrong.length);
      expect(put.status).toBe(409);
      expect(put.body.type).toContain('blob-hash-mismatch');

      const reoffered = await offer(claimed, wrong.length);
      expect(reoffered.body).toEqual({ status: BLOB_OFFER_STATUSES.WANTED, receivedBytes: 0 });
    });

    it('rejects a chunk whose offset does not match the staged bytes', async () => {
      const content = Buffer.from('offset mismatch push');
      const hash = hashOf(content);
      await reference(hash);

      const put = await putChunk(hash, content.subarray(5), 5, content.length);
      expect(put).toHaveRequestError();

      const offered = await offer(hash, content.length);
      expect(offered.body).toEqual({ status: BLOB_OFFER_STATUSES.WANTED, receivedBytes: 0 });
    });

    it('rejects and discards staging that overruns the declared total', async () => {
      const content = Buffer.from('overrun push');
      const hash = hashOf(content);
      await reference(hash);

      const put = await putChunk(hash, content, 0, 5);
      expect(put).toHaveRequestError();

      const offered = await offer(hash, content.length);
      expect(offered.body).toEqual({ status: BLOB_OFFER_STATUSES.WANTED, receivedBytes: 0 });
    });

    it('accepts a zero-byte blob', async () => {
      await reference(EMPTY_HASH);
      const offered = await offer(EMPTY_HASH, 0);
      expect(offered.body).toEqual({ status: BLOB_OFFER_STATUSES.WANTED, receivedBytes: 0 });

      const put = await putChunk(EMPTY_HASH, Buffer.alloc(0), 0, 0);
      expect(put).toHaveSucceeded();
      expect(put.body).toEqual({ acknowledged: true, existed: false, size: 0 });
    });
  });

  describe('fetch', () => {
    beforeAll(async () => {
      await pushWhole(HELLO_HASH, HELLO);
    });

    it('streams held content with the hash as entity tag', async () => {
      const response = await getBlob(HELLO_HASH).buffer(true);
      expect(response).toHaveSucceeded();
      expect(response.headers['content-type']).toBe('application/octet-stream');
      expect(response.headers['content-length']).toBe(String(HELLO.length));
      expect(response.headers.etag).toBe(`"${HELLO_HASH}"`);
      expect(response.headers['accept-ranges']).toBe('bytes');
      expect(Buffer.from(response.body).equals(HELLO)).toBe(true);
    });

    it('serves an open-ended range so an interrupted fetch resumes', async () => {
      const response = await getBlob(HELLO_HASH).set('range', 'bytes=6-').buffer(true);
      expect(response.status).toBe(206);
      expect(response.headers['content-range']).toBe(`bytes 6-10/${HELLO.length}`);
      expect(Buffer.from(response.body).toString()).toBe('world');
    });

    it('serves a closed range', async () => {
      const response = await getBlob(HELLO_HASH).set('range', 'bytes=0-4').buffer(true);
      expect(response.status).toBe(206);
      expect(Buffer.from(response.body).toString()).toBe('hello');
    });

    it('rejects an unsatisfiable range', async () => {
      const response = await getBlob(HELLO_HASH)
        .set('range', `bytes=${HELLO.length}-`)
        .buffer(true);
      expect(response.status).toBe(416);
      expect(response.headers['content-range']).toBe(`bytes */${HELLO.length}`);
    });

    it('responds to an unheld hash with the availability state evident', async () => {
      const hash = hashOf('fetch-absent');
      const response = await getBlob(hash);
      expect(response.status).toBe(404);
      expect(response.body.availability).toBe(BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD);
    });
  });

  // spec: BLAC, SCRUB
  describe('corrupt content', () => {
    it('answers a corrupt hash as absent on availability and fetch', async () => {
      const content = Buffer.from('corrupt content');
      const hash = await seedHeldBlob(content);
      await reference(hash);
      await models.Blob.update(
        { integrityState: BLOB_INTEGRITY_STATES.CORRUPT },
        { where: { hash } },
      );

      const probe = await availability(hash);
      expect(probe.body).toEqual({ availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD });

      const fetched = await getBlob(hash);
      expect(fetched.status).toBe(404);
      expect(fetched.body.availability).toBe(BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD);
      expect(JSON.stringify(fetched.body)).not.toContain('corrupt');
    });

    // spec: SCRUB
    it('wants a hash whose held copy is corrupt, rather than declining it', async () => {
      const content = Buffer.from('content central found to be bad');
      const hash = await seedHeldBlob(content);
      await reference(hash);
      await models.Blob.update(
        { integrityState: BLOB_INTEGRITY_STATES.CORRUPT },
        { where: { hash } },
      );

      const offered = await offer(hash, content.length);
      expect(offered).toHaveSucceeded();
      expect(offered.body.status).toBe(BLOB_OFFER_STATUSES.WANTED);
    });

    it('replaces the corrupt copy once the pushed content verifies', async () => {
      const content = Buffer.from('content central found to be bad, replaced');
      const hash = await seedHeldBlob(content);
      await reference(hash);
      await fs.writeFile(storedPath(hash), Buffer.from('rotted'));
      await models.Blob.update(
        { integrityState: BLOB_INTEGRITY_STATES.CORRUPT },
        { where: { hash } },
      );

      const offered = await offer(hash, content.length);
      expect(offered.body.status).toBe(BLOB_OFFER_STATUSES.WANTED);
      const put = await putChunk(hash, content, 0, content.length);
      expect(put).toHaveSucceeded();
      expect(put.body.acknowledged).toBe(true);

      const blob = await models.Blob.findOne({ where: { hash } });
      expect(blob.integrityState).toBe(BLOB_INTEGRITY_STATES.VERIFIED);
      expect(await fs.readFile(storedPath(hash))).toEqual(content);

      const fetched = await getBlob(hash);
      expect(fetched).toHaveSucceeded();
    });

    it('still declines content it holds and has no fault with', async () => {
      const content = Buffer.from('content central is happy with');
      const hash = await seedHeldBlob(content);
      await reference(hash);

      const offered = await offer(hash, content.length);
      expect(offered.body.status).toBe(BLOB_OFFER_STATUSES.ALREADY_STORED);
    });
  });

  // spec: AV
  describe('quarantined content', () => {
    const quarantine = async hash =>
      await models.BlobQuarantine.create({
        hash,
        scannerVersion: 'ClamAV 1.0.5',
        signatureVersion: '27100',
      });

    it('answers a quarantined hash as withheld on availability and fetch', async () => {
      const content = Buffer.from('quarantined content');
      const hash = await seedHeldBlob(content);
      await reference(hash);
      await quarantine(hash);

      const probe = await availability(hash);
      expect(probe.body).toEqual({
        availability: BLOB_AVAILABILITY_STATES.WITHHELD_INFECTED,
      });

      const fetched = await getBlob(hash);
      expect(fetched.status).toBe(404);
      expect(fetched.body.availability).toBe(BLOB_AVAILABILITY_STATES.WITHHELD_INFECTED);
    });

    it('does not want a quarantined hash, so the bytes are never fetched again', async () => {
      const content = Buffer.from('malware central will not take again');
      const hash = hashOf(content);
      await reference(hash);
      await quarantine(hash);

      const offered = await offer(hash, content.length);
      expect(offered).toHaveSucceeded();
      expect(offered.body.status).toBe(BLOB_OFFER_STATUSES.ALREADY_STORED);
    });

    it('acknowledges pushed bytes for a quarantined hash without staging them', async () => {
      const content = Buffer.from('malware pushed anyway');
      const hash = hashOf(content);
      await reference(hash);
      await quarantine(hash);

      const put = await putChunk(hash, content, 0, content.length);
      expect(put).toHaveSucceeded();
      expect(put.body).toMatchObject({ acknowledged: true, existed: true });
      expect(await ctx.blobStore.stagedSize(hash)).toBe(0);
      expect(await models.Blob.findOne({ where: { hash } })).toBeNull();
    });

    // spec: AV
    it('withholds unscanned content from the channel under serve-only-when-known-good', async () => {
      const content = Buffer.from('content central has not scanned yet');
      const hash = await seedHeldBlob(content);
      await reference(hash);
      await models.Setting.set('blobStorage.antivirus.servePolicy', 'only-known-good');
      await models.Setting.set('blobStorage.antivirus.scanner', 'clamd');

      try {
        const probe = await availability(hash);
        expect(probe.body).toEqual({ availability: BLOB_AVAILABILITY_STATES.AWAITING_SCAN });

        const fetched = await getBlob(hash);
        expect(fetched.status).toBe(404);
        expect(fetched.body.availability).toBe(BLOB_AVAILABILITY_STATES.AWAITING_SCAN);

        await ctx.blobStore.recordScanVerdict(hash, {
          verdict: BLOB_SCAN_VERDICTS.CLEAN,
          scannerVersion: 'ClamAV 1.0.5',
          signatureVersion: '27100',
        });
        expect(await getBlob(hash)).toHaveSucceeded();
      } finally {
        await models.Setting.set('blobStorage.antivirus.servePolicy', 'unless-known-bad');
        await models.Setting.set('blobStorage.antivirus.scanner', 'none');
      }
    });

    it('keeps the quarantine when the content is already held and verifies', async () => {
      const content = Buffer.from('content quarantined after it was stored');
      const hash = await seedHeldBlob(content);
      await reference(hash);
      await quarantine(hash);

      const put = await putChunk(hash, content, 0, content.length);
      expect(put).toHaveSucceeded();
      expect(await models.BlobQuarantine.findOne({ where: { hash } })).not.toBeNull();
      const fetched = await getBlob(hash);
      expect(fetched.status).toBe(404);
    });
  });

  // spec: BLAC, SCRUB
  describe('absent content', () => {
    it('answers an absent hash as not held on availability and fetch', async () => {
      const content = Buffer.from('absent content');
      const hash = await seedHeldBlob(content);
      await reference(hash);
      await models.Blob.update(
        { integrityState: BLOB_INTEGRITY_STATES.ABSENT },
        { where: { hash } },
      );

      const probe = await availability(hash);
      expect(probe.body).toEqual({ availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD });

      const fetched = await getBlob(hash);
      expect(fetched.status).toBe(404);
      expect(fetched.body.availability).toBe(BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD);
    });

    it('wants a hash whose held copy is absent, rather than declining it', async () => {
      const content = Buffer.from('content whose bytes central lost');
      const hash = await seedHeldBlob(content);
      await reference(hash);
      await models.Blob.update(
        { integrityState: BLOB_INTEGRITY_STATES.ABSENT },
        { where: { hash } },
      );

      const offered = await offer(hash, content.length);
      expect(offered).toHaveSucceeded();
      expect(offered.body.status).toBe(BLOB_OFFER_STATUSES.WANTED);
    });
  });

  // spec: BLAC
  // With facility restriction off the sync user may access every facility, yet the scope must stay
  // the declared one.
  describe('scope is the declared facility, not the entitlement', () => {
    it('does not serve a blob referenced only outside the declared facilities', async () => {
      const otherFacility = await models.Facility.create(fake(models.Facility));
      const patientElsewhere = await models.Patient.create(fake(models.Patient));
      await models.PatientFacility.create({
        id: models.PatientFacility.generateId(),
        patientId: patientElsewhere.id,
        facilityId: otherFacility.id,
      });
      const content = Buffer.from('referenced only elsewhere');
      const hash = await seedHeldBlob(content);
      await reference(hash, { patientId: patientElsewhere.id });

      const response = await availability(hash);
      expect(response.body).toEqual({ availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD });
    });
  });

  // spec: BLAC
  // Kept last: the restriction setting and sensitive facility change what users may access.
  describe('reference scoping', () => {
    let facilityA;
    let facilityB;
    let sensitiveFacility;
    let patientAtA;
    let tokenA;
    let tokenB;
    let tokenSensitive;
    let scopeA;
    let scopeB;
    let scopeSensitive;

    beforeAll(async () => {
      await models.Setting.set('auth.restrictUsersToFacilities', true);
      facilityA = await models.Facility.create(fake(models.Facility));
      facilityB = await models.Facility.create(fake(models.Facility));
      sensitiveFacility = await models.Facility.create(
        fake(models.Facility, { isSensitive: true }),
      );
      patientAtA = await models.Patient.create(fake(models.Patient));
      await models.PatientFacility.create({
        id: models.PatientFacility.generateId(),
        patientId: patientAtA.id,
        facilityId: facilityA.id,
      });
      ({ token: tokenA } = await asSyncDevice('blob-scope-device-a', {
        facilityId: facilityA.id,
      }));
      ({ token: tokenB } = await asSyncDevice('blob-scope-device-b', {
        facilityId: facilityB.id,
      }));
      ({ token: tokenSensitive } = await asSyncDevice('blob-scope-device-s', {
        facilityId: sensitiveFacility.id,
      }));
      scopeA = { token: tokenA, facilityIds: [facilityA.id] };
      scopeB = { token: tokenB, facilityIds: [facilityB.id] };
      scopeSensitive = { token: tokenSensitive, facilityIds: [sensitiveFacility.id] };
    });

    afterAll(async () => {
      await models.Setting.set('auth.restrictUsersToFacilities', false);
    });

    it('refuses a request that declares a facility the user cannot access', async () => {
      const response = await availability(HELLO_HASH, {
        token: tokenA,
        facilityIds: [sensitiveFacility.id],
      });
      expect(response.status).toBe(403);
    });

    // spec: BLAC
    it('refuses a facility list mixing one the user can access with one it cannot', async () => {
      const content = Buffer.from('referenced at the sensitive facility alone');
      const hash = await seedHeldBlob(content);
      await reference(hash, { facilityId: sensitiveFacility.id });

      for (const facilityIds of [
        [facilityA.id, sensitiveFacility.id],
        [sensitiveFacility.id, facilityA.id],
      ]) {
        const scope = { token: tokenA, facilityIds };
        expect(await availability(hash, scope)).toBeForbidden();
        expect(await getBlob(hash, scope)).toBeForbidden();
        expect(await offer(hash, content.length, scope)).toBeForbidden();
      }
    });

    describe('fetch', () => {
      it('serves a blob referenced by a record in the declared facility scope', async () => {
        const content = Buffer.from('scoped fetch in scope');
        const hash = await seedHeldBlob(content);
        await reference(hash, { patientId: patientAtA.id });

        const response = await getBlob(hash, scopeA).buffer(true);
        expect(response).toHaveSucceeded();
        expect(Buffer.from(response.body).equals(content)).toBe(true);
      });

      it('answers an out-of-scope hash identically to one it does not hold', async () => {
        const content = Buffer.from('scoped fetch out of scope');
        const hash = await seedHeldBlob(content);
        await reference(hash, { patientId: patientAtA.id });
        const unknownHash = hashOf('scoped fetch never seen');

        const outOfScope = await getBlob(hash, scopeB);
        const unknown = await getBlob(unknownHash, scopeB);
        expect(outOfScope.status).toBe(404);
        expect(unknown.status).toBe(404);
        expect(outOfScope.body.availability).toBe(BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD);
        expect(withHashRedacted(outOfScope.body, hash)).toEqual(
          withHashRedacted(unknown.body, unknownHash),
        );

        const probeOutOfScope = await availability(hash, scopeB);
        const probeUnknown = await availability(unknownHash, scopeB);
        expect(probeOutOfScope.body).toEqual(probeUnknown.body);
      });

      it('applies sensitive-facility restrictions', async () => {
        const content = Buffer.from('sensitive facility blob');
        const hash = await seedHeldBlob(content);
        await reference(hash, { facilityId: sensitiveFacility.id });

        const outside = await availability(hash, scopeA);
        expect(outside.body).toEqual({ availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD });

        const member = await availability(hash, scopeSensitive);
        expect(member.body).toEqual({
          availability: BLOB_AVAILABILITY_STATES.AVAILABLE,
          size: content.length,
        });
      });

      it('serves a hash when any one of its references is in scope', async () => {
        const content = Buffer.from('one reference suffices');
        const hash = await seedHeldBlob(content);
        await reference(hash, { facilityId: sensitiveFacility.id });
        await reference(hash, { patientId: patientAtA.id });

        const response = await availability(hash, scopeA);
        expect(response.body).toEqual({
          availability: BLOB_AVAILABILITY_STATES.AVAILABLE,
          size: content.length,
        });
      });

      it('answers a held but unreferenced hash as absent for any requester', async () => {
        const hash = await seedHeldBlob(Buffer.from('orphan bytes'));
        for (const scope of [scopeA, scopeB, scopeSensitive]) {
          const response = await availability(hash, scope);
          expect(response.body).toEqual({
            availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD,
          });
        }
      });

      it('scopes to every facility a multi-facility server declares', async () => {
        const user = await models.User.create(fake(models.User, { password: 'password' }));
        for (const facilityId of [facilityA.id, facilityB.id]) {
          await models.UserFacility.create(fake(models.UserFacility, { userId: user.id, facilityId }));
        }
        await models.Device.create(
          fake(models.Device, {
            id: 'blob-scope-device-ab',
            registeredById: user.id,
            scopes: [DEVICE_SCOPES.SYNC_CLIENT],
          }),
        );
        const login = await baseApp.post('/api/login').send({
          email: user.email,
          password: 'password',
          deviceId: 'blob-scope-device-ab',
          scopes: [DEVICE_SCOPES.SYNC_CLIENT],
        });
        const scopeAB = { token: login.body.token, facilityIds: [facilityA.id, facilityB.id] };

        const patientAtB = await models.Patient.create(fake(models.Patient));
        await models.PatientFacility.create({
          id: models.PatientFacility.generateId(),
          patientId: patientAtB.id,
          facilityId: facilityB.id,
        });
        const content = Buffer.from('multi facility scope');
        const hash = await seedHeldBlob(content);
        await reference(hash, { patientId: patientAtB.id });

        const response = await availability(hash, scopeAB);
        expect(response.body).toEqual({
          availability: BLOB_AVAILABILITY_STATES.AVAILABLE,
          size: content.length,
        });
      });
    });

    describe('push', () => {
      it('wants an offer for a hash a synchronised in-scope record references', async () => {
        const content = Buffer.from('gated push wanted');
        const hash = hashOf(content);
        await reference(hash, { patientId: patientAtA.id });

        const offered = await offer(hash, content.length, scopeA);
        expect(offered.body).toEqual({ status: BLOB_OFFER_STATUSES.WANTED, receivedBytes: 0 });
      });

      it('refuses an offer for an unreferenced hash', async () => {
        const offered = await offer(hashOf('never referenced'), 16, scopeA);
        expect(offered.status).toBe(403);
      });

      it('refuses an offer for a hash referenced only outside the offering server scope', async () => {
        const hash = hashOf('someone elses blob');
        await reference(hash, { facilityId: sensitiveFacility.id });

        const offered = await offer(hash, 18, scopeA);
        expect(offered.status).toBe(403);
      });

      it('refuses held-but-unexpected content identically to absent-and-unexpected', async () => {
        const heldHash = await seedHeldBlob(Buffer.from('held unexpected'));
        const absentHash = hashOf('absent unexpected');

        const held = await offer(heldHash, 15, scopeA);
        const absent = await offer(absentHash, 17, scopeA);
        expect(held.status).toBe(403);
        expect(absent.status).toBe(403);
        expect(withHashRedacted(held.body, heldHash)).toEqual(
          withHashRedacted(absent.body, absentHash),
        );
      });

      it('refuses content for an unexpected hash without staging any of it', async () => {
        const content = Buffer.from('unexpected content push');
        const hash = hashOf(content);

        const put = await putChunk(hash, content, 0, content.length, scopeA);
        expect(put.status).toBe(403);

        await reference(hash, { patientId: patientAtA.id });
        const offered = await offer(hash, content.length, scopeA);
        expect(offered.body).toEqual({ status: BLOB_OFFER_STATUSES.WANTED, receivedBytes: 0 });
      });

      it('refuses a resumed segment when the hash is no longer expected', async () => {
        const content = Buffer.from('withdrawn mid push!!');
        const hash = hashOf(content);
        const recordId = await reference(hash, { patientId: patientAtA.id });

        const first = await putChunk(hash, content.subarray(0, 10), 0, content.length, scopeA);
        expect(first.body).toEqual({ acknowledged: false, receivedBytes: 10 });

        await dereference(recordId);
        const second = await putChunk(hash, content.subarray(10), 10, content.length, scopeA);
        expect(second.status).toBe(403);
      });

      it('accepts the push once the referencing record has synchronised', async () => {
        const content = Buffer.from('sync first round trip');
        const hash = hashOf(content);

        const early = await offer(hash, content.length, scopeA);
        expect(early.status).toBe(403);

        await reference(hash, { patientId: patientAtA.id });
        const offered = await offer(hash, content.length, scopeA);
        expect(offered.body).toEqual({ status: BLOB_OFFER_STATUSES.WANTED, receivedBytes: 0 });

        const put = await putChunk(hash, content, 0, content.length, scopeA);
        expect(put.body).toEqual({ acknowledged: true, existed: false, size: content.length });

        const row = await models.Blob.findOne({ where: { hash } });
        expect(row).toMatchObject({ size: content.length });
      });
    });
    // The device declares one facility as a scalar and always resumes with an open-ended range.
    describe('device-shaped requests', () => {
      const asDevice = () => ({ token: tokenA, facilityIds: facilityA.id });

      it('accepts a push that declares a single facility as a scalar', async () => {
        const content = Buffer.from('captured on a phone');
        const hash = hashOf(content);
        await reference(hash, { patientId: patientAtA.id });

        const offered = await offer(hash, content.length, asDevice());
        expect(offered.body).toEqual({ status: BLOB_OFFER_STATUSES.WANTED, receivedBytes: 0 });

        const put = await putChunk(hash, content, 0, content.length, asDevice());
        expect(put.body).toEqual({ acknowledged: true, existed: false, size: content.length });
      });

      it('serves content pushed by a device back to a device resuming with a range', async () => {
        const content = Buffer.from('round trips both ways');
        const hash = hashOf(content);
        await reference(hash, { patientId: patientAtA.id });
        await offer(hash, content.length, asDevice());
        await putChunk(hash, content, 0, content.length, asDevice());

        const reported = await availability(hash, asDevice());
        expect(reported.body).toEqual({
          availability: BLOB_AVAILABILITY_STATES.AVAILABLE,
          size: content.length,
        });

        const resumed = await getBlob(hash, asDevice()).set('range', 'bytes=8-').buffer(true);
        expect(resumed.status).toBe(206);
        expect(resumed.headers['content-range']).toBe(`bytes 8-${content.length - 1}/${content.length}`);
        expect(Buffer.from(resumed.body)).toEqual(content.subarray(8));
      });
    });

    // spec: BLAC, ATCH
    // The same gate over real `attachments` rows rather than the scratch table.
    describe('attachment references', () => {
      let inScopeHash;
      let sensitiveHash;

      const attachmentCarrying = async (hash, content, overrides) =>
        await models.Attachment.create(
          fake(models.Attachment, {
            ...overrides,
            type: 'text/plain',
            size: content.length,
            hash,
            data: null,
          }),
        );

      beforeAll(async () => {
        const inScopeContent = Buffer.from('bytes an attachment row references');
        inScopeHash = await seedHeldBlob(inScopeContent);
        await attachmentCarrying(inScopeHash, inScopeContent, { patientId: patientAtA.id });

        await models.PatientFacility.create({
          id: models.PatientFacility.generateId(),
          patientId: patientAtA.id,
          facilityId: sensitiveFacility.id,
        });
        const department = await models.Department.create(
          fake(models.Department, { facilityId: sensitiveFacility.id }),
        );
        const location = await models.Location.create(
          fake(models.Location, { facilityId: sensitiveFacility.id }),
        );
        const examiner = await models.User.create(fake(models.User));
        const encounter = await models.Encounter.create(
          fake(models.Encounter, {
            patientId: patientAtA.id,
            departmentId: department.id,
            locationId: location.id,
            examinerId: examiner.id,
            endDate: null,
          }),
        );
        const sensitiveContent = Buffer.from('bytes attached at the sensitive facility');
        sensitiveHash = await seedHeldBlob(sensitiveContent);
        await attachmentCarrying(sensitiveHash, sensitiveContent, { encounterId: encounter.id });

        await new CentralSyncManager(ctx).updateLookupTable();
      });

      it('serves a blob an attachment row references within the declared scope', async () => {
        const served = await getBlob(inScopeHash, scopeA).buffer(true);
        expect(served).toHaveSucceeded();
        expect(Buffer.from(served.body).toString()).toBe('bytes an attachment row references');

        const elsewhere = await availability(inScopeHash, scopeB);
        expect(elsewhere.body).toEqual({
          availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD,
        });
      });

      it('applies the sensitive-facility restriction to an attachment', async () => {
        const outside = await availability(sensitiveHash, scopeA);
        expect(outside.body).toEqual({ availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD });

        expect(await getBlob(sensitiveHash, scopeSensitive)).toHaveSucceeded();
      });
    });
  });
});
