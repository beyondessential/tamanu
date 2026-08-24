import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { fake } from '@tamanu/fake-data/fake';

import { createTestContext } from '../utilities';
import { CentralSyncManager } from '../../app/sync/CentralSyncManager';

// spec: ATCH
// Attachments synchronise as ordinary patient-scoped records carrying only their
// hash. A legacy attachment holds its bytes in the row and stays on the central
// server, so it must never enter the lookup and reach a facility.
describe('Attachment sync scope', () => {
  let ctx;
  let models;
  let centralSyncManager;
  let patient;
  let otherPatient;

  const lookupFor = async attachmentId => {
    const rows = await models.SyncLookup.findAll({
      where: { recordType: 'attachments', recordId: attachmentId },
    });
    return rows[0] ?? null;
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models } = ctx.store);
    centralSyncManager = new CentralSyncManager(ctx);
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.SyncLookup.truncate({ force: true });
    await models.Attachment.truncate({ force: true });
    patient = await models.Patient.create(fake(models.Patient));
    otherPatient = await models.Patient.create(fake(models.Patient));
  });

  it('gives a hash-backed attachment a lookup entry scoped to its patient', async () => {
    const attachment = await models.Attachment.create(
      fake(models.Attachment, {
        patientId: patient.id,
        hash: 'sha256:1111111111111111111111111111111111111111111111111111111111111111',
        data: null,
      }),
    );

    await centralSyncManager.updateLookupTable();

    const lookup = await lookupFor(attachment.id);
    expect(lookup).not.toBeNull();
    expect(lookup.patientId).toBe(patient.id);
    expect(lookup.patientId).not.toBe(otherPatient.id);
  });

  it('carries the hash and not the bytes in the synchronised payload', async () => {
    const attachment = await models.Attachment.create(
      fake(models.Attachment, {
        patientId: patient.id,
        hash: 'sha256:2222222222222222222222222222222222222222222222222222222222222222',
        data: null,
      }),
    );

    await centralSyncManager.updateLookupTable();

    const lookup = await lookupFor(attachment.id);
    expect(lookup.data.hash).toBe(attachment.hash);
    expect(lookup.data.data).toBeFalsy();
  });

  it('keeps a legacy attachment out of the lookup entirely', async () => {
    const legacy = await models.Attachment.create(
      fake(models.Attachment, {
        patientId: patient.id,
        hash: null,
        data: Buffer.from('legacy bytes held in the database row', 'utf8'),
      }),
    );

    await centralSyncManager.updateLookupTable();

    expect(await lookupFor(legacy.id)).toBeNull();
  });

  it('keeps a legacy attachment out of the lookup through a full rebuild', async () => {
    const legacy = await models.Attachment.create(
      fake(models.Attachment, {
        patientId: patient.id,
        hash: null,
        data: Buffer.from('legacy bytes surviving a rebuild', 'utf8'),
      }),
    );
    await ctx.store.sequelize.query(`SELECT flag_lookup_model_to_rebuild('attachments');`);

    await centralSyncManager.updateLookupTable();

    expect(await lookupFor(legacy.id)).toBeNull();
  });
});
