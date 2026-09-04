import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createHash, randomUUID } from 'node:crypto';

import { DOCUMENT_SIZE_LIMIT, BLOB_TIERS } from '@tamanu/constants';
import { createDummyPatient } from '@tamanu/database/demoData/patients';

import { createTestContext } from '../utilities';
import { uploadAttachment } from '../../app/utils/uploadAttachment';

const hashOf = content => `sha256:${createHash('sha256').update(content).digest('hex')}`;

// The route suites stand uploadAttachment down and assert it was called, so the
// limit the route hands it has never been applied to a real request. This one
// puts the real implementation back.
const actual = await vi.importActual('../../app/utils/uploadAttachment');

describe('document upload size limit', () => {
  let ctx;
  let models;
  let app;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    app = await ctx.baseApp.asRole('practitioner');
    uploadAttachment.mockImplementation(actual.uploadAttachment);
  });

  afterAll(() => ctx.close());

  const post = (patientId, content) =>
    app
      .post(`/api/patient/${patientId}/documentMetadata`)
      .field(
        'jsonData',
        JSON.stringify({
          name: `document ${randomUUID()}`,
          type: 'application/pdf',
          documentOwner: 'someone',
        }),
      )
      .attach('file', content, 'scan.pdf');

  // verifies spec: ATCH — an upload larger than the configured maximum file
  // size is rejected, and nothing is admitted on the way to the refusal.
  it('refuses an upload past the maximum and admits nothing', async () => {
    const patient = await models.Patient.create(await createDummyPatient(models));
    const content = Buffer.alloc(DOCUMENT_SIZE_LIMIT + 1, 'o');

    const result = await post(patient.id, content);

    expect(result).toHaveRequestError();
    expect(result.body.detail).toBe(`Uploaded file exceeds limit of ${DOCUMENT_SIZE_LIMIT} bytes.`);
    expect(await models.Attachment.count({ where: { hash: hashOf(content) } })).toBe(0);
    expect(await models.Blob.count({ where: { hash: hashOf(content) } })).toBe(0);
    expect(await models.DocumentMetadata.count({ where: { patientId: patient.id } })).toBe(0);
  });

  it('accepts an upload within the maximum', async () => {
    const patient = await models.Patient.create(await createDummyPatient(models));
    const content = Buffer.from(`a scanned referral ${randomUUID()}`);

    const result = await post(patient.id, content);

    expect(result).toHaveSucceeded();
    const attachment = await models.Attachment.findOne({ where: { hash: hashOf(content) } });
    expect(attachment.size).toBe(content.length);
    expect((await models.Blob.findOne({ where: { hash: hashOf(content) } })).tier).toBe(
      BLOB_TIERS.OUTBOX,
    );
    expect(await models.DocumentMetadata.count({ where: { attachmentId: attachment.id } })).toBe(1);
  });
});
