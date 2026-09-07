import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createHash, randomUUID } from 'node:crypto';

import { fake } from '@tamanu/fake-data/fake';

import { createTestContext } from '../utilities';
import { deleteRedundantLocalCopies } from '../../app/sync/deleteRedundantLocalCopies';

const hashOf = content => `sha256:${createHash('sha256').update(content).digest('hex')}`;

// verifies spec: ATCH
// Attachment records synchronise as ordinary persistent records, so a facility
// still holds them once they have reached the central server. Nothing else
// resolves their content from here afterwards: the hash lives on the row.
describe('attachment retention after a push', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
  });

  afterAll(() => ctx.close());

  it('keeps an attachment row the push cleanup has been handed', async () => {
    const patient = await models.Patient.create(fake(models.Patient));
    const hash = hashOf(randomUUID());
    const attachment = await models.Attachment.create({
      type: 'application/pdf',
      hash,
      size: 12,
      patientId: patient.id,
    });

    await deleteRedundantLocalCopies(models, [
      { recordType: models.Attachment.tableName, recordId: attachment.id },
    ]);

    const retained = await models.Attachment.findByPk(attachment.id);
    expect(retained).not.toBeNull();
    expect(retained.hash).toBe(hash);
    expect(retained.data).toBeNull();
  });
});
