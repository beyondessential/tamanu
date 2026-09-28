import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Readable } from 'node:stream';
import { createHash } from 'node:crypto';

import config from 'config';

import {
  BLOB_AVAILABILITY_STATES,
  BLOB_SCAN_VERDICTS,
  MAX_INLINE_BLOB_BYTES,
  SETTINGS_SCOPES,
} from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

import { createTestContext } from '../utilities';
import { CentralServerConnection } from '../../app/sync/CentralServerConnection';

const hashOf = content => `sha256:${createHash('sha256').update(content).digest('hex')}`;

// spec: ATCH
describe('Attachment (facility-server)', () => {
  let ctx;
  let app;
  let models;
  let uniqueSuffix = 0;
  const [facilityId] = selectFacilityIds(config);

  const uniqueContent = () =>
    Buffer.from(`an attachment served from the facility store ${(uniqueSuffix += 1)}`, 'utf8');

  const makeAttachment = async (hash, size) =>
    await models.Attachment.create(
      fake(models.Attachment, { hash, data: null, type: 'text/plain', size }),
    );

  // Local content is available without consulting central, so only the remote half is faked.
  const setCentral = ({ holds = null } = {}) => {
    ctx.blobCache.setTransferChannel({
      availability: async (hash, { stat } = {}) => {
        const local = stat === undefined ? await ctx.blobStore.servableStat(hash) : stat;
        if (local) {
          return { availability: BLOB_AVAILABILITY_STATES.AVAILABLE, size: local.size };
        }
        if (holds && hashOf(holds) === hash) {
          return { availability: BLOB_AVAILABILITY_STATES.AWAITING_FETCH, size: holds.length };
        }
        return { availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD };
      },
      fetchFromCentral: async hash => {
        if (!holds || hashOf(holds) !== hash) {
          throw new Error(`central does not hold ${hash}`);
        }
        return await ctx.blobStore.put(Readable.from([holds]));
      },
    });
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');
    models = ctx.models;
  });

  afterAll(() => ctx.close());

  it('serves an attachment whose bytes are held locally', async () => {
    const content = uniqueContent();
    const { hash } = await ctx.blobStore.put(Readable.from([content]));
    const attachment = await makeAttachment(hash, content.length);
    setCentral();

    const result = await app.get(`/api/attachment/${attachment.id}`);
    expect(result).toHaveSucceeded();
    expect(result.text).toBe(content.toString('utf8'));
    expect(result.headers.etag).toBe(`"${hash}"`);
  });

  it('resolves the bytes from central on a local miss and serves them', async () => {
    const content = uniqueContent();
    const hash = hashOf(content);
    const attachment = await makeAttachment(hash, content.length);
    setCentral({ holds: content });

    expect(await ctx.blobStore.stat(hash)).toBeNull();

    const result = await app.get(`/api/attachment/${attachment.id}`);
    expect(result).toHaveSucceeded();
    expect(result.text).toBe(content.toString('utf8'));
    expect(await ctx.blobStore.stat(hash)).not.toBeNull();
  });

  it('presents content neither server holds as awaiting its content', async () => {
    const content = uniqueContent();
    const attachment = await makeAttachment(hashOf(content), content.length);
    setCentral();

    const result = await app.get(`/api/attachment/${attachment.id}`);
    expect(result.status).toBe(202);
    expect(result.body).toMatchObject({
      attachmentId: attachment.id,
      availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD,
    });
  });

  it('presents a record that has not reached either server as awaiting its content', async () => {
    CentralServerConnection.mockImplementation(function () {
      return {
        fetch: async () => {
          throw Object.assign(new Error('forbidden'), { status: 403 });
        },
      };
    });

    try {
      const result = await app.get('/api/attachment/not-synced-here-yet');
      expect(result.status).toBe(202);
      expect(result.body).toMatchObject({
        attachmentId: 'not-synced-here-yet',
        availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD,
      });
    } finally {
      CentralServerConnection.mockReset();
    }
  });

  // spec: AV
  it('withholds a quarantined attachment it already holds, without asking central', async () => {
    const content = uniqueContent();
    const { hash } = await ctx.blobStore.put(Readable.from([content]));
    const attachment = await makeAttachment(hash, content.length);
    await models.BlobQuarantine.create({ hash });
    ctx.blobCache.setTransferChannel({
      availability: async () => {
        throw new Error('central must not be consulted for known-bad content');
      },
    });

    const result = await app.get(`/api/attachment/${attachment.id}`);
    expect(result.status).toBe(202);
    expect(result.body).toMatchObject({
      attachmentId: attachment.id,
      availability: BLOB_AVAILABILITY_STATES.WITHHELD_INFECTED,
    });
  });

  // spec: AV
  // A facility only has verdicts for content it scanned itself, so the two legs answer differently.
  describe('under serve-only-when-known-good', () => {
    beforeEach(async () => {
      await models.Setting.set(
        'blobStorage.antivirus.servePolicy',
        'only-known-good',
        SETTINGS_SCOPES.GLOBAL,
      );
      await models.Setting.set(
        'blobStorage.antivirus.scanner',
        'clamd',
        SETTINGS_SCOPES.FACILITY,
        facilityId,
      );
    });

    afterEach(async () => {
      await models.Setting.set(
        'blobStorage.antivirus.servePolicy',
        'unless-known-bad',
        SETTINGS_SCOPES.GLOBAL,
      );
      await models.Setting.set(
        'blobStorage.antivirus.scanner',
        'none',
        SETTINGS_SCOPES.FACILITY,
        facilityId,
      );
    });

    it('withholds content it holds but has not scanned', async () => {
      const content = uniqueContent();
      const { hash } = await ctx.blobStore.put(Readable.from([content]));
      const attachment = await makeAttachment(hash, content.length);
      setCentral();

      const result = await app.get(`/api/attachment/${attachment.id}`);
      expect(result.status).toBe(202);
      expect(result.body).toMatchObject({
        attachmentId: attachment.id,
        availability: BLOB_AVAILABILITY_STATES.AWAITING_SCAN,
      });
    });

    it('serves the same content once its own scan has passed', async () => {
      const content = uniqueContent();
      const { hash } = await ctx.blobStore.put(Readable.from([content]));
      const attachment = await makeAttachment(hash, content.length);
      await ctx.blobStore.recordScanVerdict(hash, {
        verdict: BLOB_SCAN_VERDICTS.CLEAN,
        scannerVersion: 'ClamAV 1.0.5',
        signatureVersion: '27100',
      });
      setCentral();

      const result = await app.get(`/api/attachment/${attachment.id}`);
      expect(result).toHaveSucceeded();
      expect(result.text).toBe(content.toString('utf8'));
    });

    // The scan reads stored content, so withholding unheld content here would keep it from ever
    // being scanned.
    it('still resolves content it does not hold from central', async () => {
      const content = uniqueContent();
      const hash = hashOf(content);
      const attachment = await makeAttachment(hash, content.length);
      setCentral({ holds: content });

      const result = await app.get(`/api/attachment/${attachment.id}`);
      expect(result).toHaveSucceeded();
      expect(result.text).toBe(content.toString('utf8'));
    });

    it('forwards awaiting-scan when central is the one withholding', async () => {
      const content = uniqueContent();
      const attachment = await makeAttachment(hashOf(content), content.length);
      ctx.blobCache.setTransferChannel({
        availability: async () => ({ availability: BLOB_AVAILABILITY_STATES.AWAITING_SCAN }),
      });

      const result = await app.get(`/api/attachment/${attachment.id}`);
      expect(result.status).toBe(202);
      expect(result.body).toMatchObject({
        attachmentId: attachment.id,
        availability: BLOB_AVAILABILITY_STATES.AWAITING_SCAN,
      });
    });

    it('forwards withheld-infected when central is the one withholding', async () => {
      const content = uniqueContent();
      const attachment = await makeAttachment(hashOf(content), content.length);
      ctx.blobCache.setTransferChannel({
        availability: async () => ({ availability: BLOB_AVAILABILITY_STATES.WITHHELD_INFECTED }),
      });

      const result = await app.get(`/api/attachment/${attachment.id}`);
      expect(result.status).toBe(202);
      expect(result.body).toMatchObject({
        attachmentId: attachment.id,
        availability: BLOB_AVAILABILITY_STATES.WITHHELD_INFECTED,
      });
    });
  });

  it('serves a locally held attachment base64-encoded when asked', async () => {
    const content = uniqueContent();
    const { hash } = await ctx.blobStore.put(Readable.from([content]));
    const attachment = await makeAttachment(hash, content.length);
    setCentral();

    const result = await app.get(`/api/attachment/${attachment.id}?base64=true`);
    expect(result).toHaveSucceeded();
    expect(result.body.data).toBe(content.toString('base64'));
  });

  // spec: SERVE
  it('refuses to encode a locally held attachment past the inline limit', async () => {
    const content = uniqueContent();
    const { hash } = await ctx.blobStore.put(Readable.from([content]));
    const attachment = await makeAttachment(hash, content.length);
    ctx.blobCache.setTransferChannel({
      availability: async () => ({
        availability: BLOB_AVAILABILITY_STATES.AVAILABLE,
        size: MAX_INLINE_BLOB_BYTES + 1,
      }),
    });

    const result = await app.get(`/api/attachment/${attachment.id}?base64=true`);
    expect(result).toHaveRequestError(422);
  });

  it('serves a requested byte range of a locally held attachment', async () => {
    const content = uniqueContent();
    const { hash } = await ctx.blobStore.put(Readable.from([content]));
    const attachment = await makeAttachment(hash, content.length);
    setCentral();

    const result = await app.get(`/api/attachment/${attachment.id}`).set('range', 'bytes=3-9');
    expect(result.status).toBe(206);
    expect(result.text).toBe(content.subarray(3, 10).toString('utf8'));
  });
});
