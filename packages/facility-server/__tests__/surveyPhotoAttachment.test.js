import { createHash } from 'node:crypto';

import { BLOB_TIERS, PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';

import { createTestContext } from './utilities';

const hashOf = content => `sha256:${createHash('sha256').update(content).digest('hex')}`;

// spec: ATCH
// A survey photo answer creates a blob-backed attachment: the image is admitted
// to the facility outbox and the row records only its hash, so it synchronises
// with the answer that references it rather than carrying its bytes through sync.
describe('Survey photo attachments (facility-server)', () => {
  let ctx;
  let models;
  let patient;
  let encounter;

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models } = ctx.store);
    patient = await models.Patient.create(await createDummyPatient(models));
    encounter = await models.Encounter.create(
      await createDummyEncounter(models, { patientId: patient.id }),
    );
  });

  afterAll(() => ctx.close());

  it('admits a photo answer to the outbox and records only its hash', async () => {
    const image = Buffer.from('a survey photo captured on the facility', 'utf8');

    const attachmentId = await models.SurveyResponse.getBodyForAnswer(
      PROGRAM_DATA_ELEMENT_TYPES.PHOTO,
      { size: image.length, data: image.toString('base64') },
      models,
      { encounterId: encounter.id },
    );

    const attachment = await models.Attachment.findByPk(attachmentId);
    expect(attachment.hash).toBe(hashOf(image));
    expect(attachment.data).toBeFalsy();
    expect(attachment.encounterId).toBe(encounter.id);
    expect(Number(attachment.size)).toBe(image.length);

    // spec: ATCH — a caller that knows only the encounter still gets the patient
    // linkage copied on, so the row is scoped like every other attachment
    expect(attachment.patientId).toBe(patient.id);

    const blob = await models.Blob.findOne({ where: { hash: attachment.hash } });
    expect(blob.tier).toBe(BLOB_TIERS.OUTBOX);
  });

  it('keeps an already-uploaded attachment id as the answer body', async () => {
    const body = await models.SurveyResponse.getBodyForAnswer(
      PROGRAM_DATA_ELEMENT_TYPES.PHOTO,
      'existing-attachment-id',
      models,
    );
    expect(body).toBe('existing-attachment-id');
  });
});
