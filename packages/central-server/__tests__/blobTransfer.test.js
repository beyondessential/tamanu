import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';

import { fake } from '@tamanu/fake-data/fake';
import {
  BLOB_AVAILABILITY_STATES,
  BLOB_INTEGRITY_STATES,
  BLOB_OFFER_STATUSES,
  DEVICE_SCOPES,
} from '@tamanu/constants';

import { registerBlobReferenceSource } from '../app/blobReferences';
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

  // The requesting server declares the facilities it acts for on every call,
  // the same scope record sync would use; the helpers thread the default home
  // facility unless a scenario supplies its own.
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
  // A record referencing the hash, present in sync_lookup: what "a
  // synchronised record central holds" looks like to the access gate. The
  // scratch reference table stands in for the consumer tables (attachments,
  // assets) until they carry hash columns. A reference with neither patient nor
  // facility is in scope for any requesting server, standing in for a plainly
  // referenced blob in the non-scoping cases.
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

  // Bytes held by central without going through the push gate.
  const seedHeldBlob = async content => (await ctx.blobStore.put(Readable.from(content))).hash;

  // Where the store keeps a hash's bytes, for tests that need to damage them.
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

  // Responses must be identical modulo the hash they were asked about. The
  // stack is dropped before comparing: it is a debug field that production
  // error bodies exclude, and the one field allowed to vary between the two
  // refusals.
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
    // every transfer-channel operation: availability probe, fetch, offer,
    // content delivery. Each entry builds a fresh request when called, so the
    // request is created and awaited one at a time rather than a batch of
    // pending supertest requests being opened at once.
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
      // A webapp token carries no device, so req.device is absent and the
      // missing-device guard fires before any scope check.
      const agent = await baseApp.asRole('practitioner');
      const response = await agent.get(
        `/api/blob/${encodeURIComponent(HELLO_HASH)}/availability`,
      );
      expect(response).toHaveRequestError();
    });

    it('rejects an authenticated user whose device lacks the sync-client scope, on every operation', async () => {
      // A registered device that holds a different scope: req.device is
      // present, so the ensureHasScope(SYNC_CLIENT) assertion is what rejects.
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

      // an interrupted push re-offers and resumes from the staged bytes
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

      // staging was discarded, so a clean retry starts over
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
  // A quarantined blob is retained but never served, so on the channel it is
  // indistinguishable from one central does not hold — availability and fetch
  // agree, and neither discloses the quarantine.
  describe('quarantined content', () => {
    it('answers a quarantined hash as absent on availability and fetch', async () => {
      const content = Buffer.from('quarantined content');
      const hash = await seedHeldBlob(content);
      await reference(hash);
      await models.Blob.update(
        { integrityState: BLOB_INTEGRITY_STATES.QUARANTINED },
        { where: { hash } },
      );

      const probe = await availability(hash);
      expect(probe.body).toEqual({ availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD });

      const fetched = await getBlob(hash);
      expect(fetched.status).toBe(404);
      expect(fetched.body.availability).toBe(BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD);
      // and does not disclose the quarantine in the message
      expect(JSON.stringify(fetched.body)).not.toContain('quarantine');
    });

    // spec: SCRUB
    // Central's peer healing. It cannot reach a facility on demand and keeps no
    // index of what facilities hold, so a replacement is taken on a connection
    // the facility makes anyway, whenever one happens to offer the content.
    it('wants a hash whose held copy is quarantined, rather than declining it', async () => {
      const content = Buffer.from('content central found to be bad');
      const hash = await seedHeldBlob(content);
      await reference(hash);
      await models.Blob.update(
        { integrityState: BLOB_INTEGRITY_STATES.QUARANTINED },
        { where: { hash } },
      );

      const offered = await offer(hash, content.length);
      expect(offered).toHaveSucceeded();
      expect(offered.body.status).toBe(BLOB_OFFER_STATUSES.WANTED);
    });

    it('replaces the quarantined copy once the pushed content verifies', async () => {
      const content = Buffer.from('content central found to be bad, replaced');
      const hash = await seedHeldBlob(content);
      await reference(hash);
      // Corrupt the stored bytes as the scrub would have found them, so the
      // replacement is a real repair rather than a no-op over good content.
      await fs.writeFile(storedPath(hash), Buffer.from('rotted'));
      await models.Blob.update(
        { integrityState: BLOB_INTEGRITY_STATES.QUARANTINED },
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

      // and it serves again
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

  // spec: BLAC
  // The scope is the declared facility set, not the user's entitlement. With
  // facility restriction off, the sync user may access every facility, yet a
  // server that declares only its own facility must still be scoped to it —
  // otherwise blob access would be wider than record sync.
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

      // the default device is entitled to every facility (restriction off) but
      // declares only its home facility, so the blob is out of scope
      const response = await availability(hash);
      expect(response.body).toEqual({ availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD });
    });
  });

  // spec: BLAC
  // Reference-layer scoping over the channel with facility restriction on, so
  // each device's declared facilities are constrained to what it may access
  // and the sensitive facility exercises the same restriction record sync
  // applies. Kept last: the restriction setting and sensitive facility change
  // what users may access.
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
      // the sensitive facility is inaccessible to a user not linked to it even
      // when facility restriction would otherwise grant every non-sensitive one
      const response = await availability(HELLO_HASH, {
        token: tokenA,
        facilityIds: [sensitiveFacility.id],
      });
      expect(response.status).toBe(403);
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
        // A server running several facilities declares them all; a blob
        // referenced at any one is in scope, and each declared facility is
        // validated against the user's entitlement.
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

        // once the reference arrives, staging starts from zero: nothing stuck
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
  });
});
