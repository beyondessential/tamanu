import { Readable } from 'node:stream';
import { createHash } from 'node:crypto';

import { BLOB_AVAILABILITY_STATES, MAX_INLINE_BLOB_BYTES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';

import { createTestContext } from '../utilities';

const hashOf = content => `sha256:${createHash('sha256').update(content).digest('hex')}`;

// spec: ATCH
// A facility serves a hash-backed attachment from its own store, resolving the
// bytes from central on a miss; content neither server holds presents as an
// existing file awaiting its content.
describe('Attachment (facility-server)', () => {
  let ctx;
  let app;
  let models;
  let uniqueSuffix = 0;

  const uniqueContent = () =>
    Buffer.from(`an attachment served from the facility store ${(uniqueSuffix += 1)}`, 'utf8');

  const makeAttachment = async (hash, size) =>
    await models.Attachment.create(
      fake(models.Attachment, { hash, data: null, type: 'text/plain', size }),
    );

  // Stands in for central: local content is available without consulting it,
  // mirroring the real channel, so only the remote half is faked here.
  const setCentral = ({ holds = null } = {}) => {
    ctx.blobCache.setTransferChannel({
      availability: async hash => {
        const local = await ctx.blobStore.stat(hash);
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
    // The fetched bytes are cached, so the next read needs no central call.
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
  // Inline encoding holds the whole content in memory, so content past the limit
  // is refused that way and the caller directed to stream it.
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
