import { randomUUID } from 'node:crypto';

import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake } from '@tamanu/fake-data/fake';

import { up as backfillAttachmentScope } from '../../database/src/migrations/1785840000001-backfillAttachmentScope';
import { createTestContext } from './utilities';

// spec: ATCH
// Attachments predating the epic carry no patient or encounter, and that scope is
// what decides which facilities an attachment synchronises to. The migration
// recovers it from whichever record references the attachment. It runs once,
// against real data, on the upgrade, so each arm of the recovery is asserted here
// rather than discovered afterwards: an attachment given the wrong patient reaches
// a facility that should not hold it.
describe('attachment scope backfill', () => {
  let ctx;
  let models;
  let patient;
  let encounter;
  let dataElement;
  let survey;

  const unscopedAttachment = async () =>
    await models.Attachment.create(
      fake(models.Attachment, {
        hash: `sha256:${randomUUID().replace(/-/g, '').repeat(2)}`,
        data: null,
        patientId: null,
        encounterId: null,
      }),
    );

  const runBackfill = () => backfillAttachmentScope(ctx.store.sequelize.getQueryInterface());

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;

    // Central's test database seeds no reference data, so the encounter's
    // department and location have to be built before it.
    const facility = await models.Facility.create(fake(models.Facility));
    const department = await models.Department.create(
      fake(models.Department, { facilityId: facility.id }),
    );
    const locationGroup = await models.LocationGroup.create(
      fake(models.LocationGroup, { facilityId: facility.id }),
    );
    const location = await models.Location.create(
      fake(models.Location, { facilityId: facility.id, locationGroupId: locationGroup.id }),
    );

    patient = await models.Patient.create(await createDummyPatient(models));
    encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
      departmentId: department.id,
      locationId: location.id,
    });

    const program = await models.Program.create(fake(models.Program));
    survey = await models.Survey.create({ ...fake(models.Survey), programId: program.id });
    dataElement = await models.ProgramDataElement.create({
      ...fake(models.ProgramDataElement),
      type: PROGRAM_DATA_ELEMENT_TYPES.PHOTO,
    });
  });

  afterAll(async () => ctx.close());

  it('recovers scope from an uploaded document', async () => {
    const attachment = await unscopedAttachment();
    await models.DocumentMetadata.create(
      fake(models.DocumentMetadata, { attachmentId: attachment.id, encounterId: encounter.id }),
    );

    await runBackfill();

    await attachment.reload();
    expect(attachment.patientId).toBe(patient.id);
    expect(attachment.encounterId).toBe(encounter.id);
  });

  // A document attached to a patient rather than an encounter: the patient comes
  // straight off the document, and there is no encounter to record.
  it('recovers scope from a document held against a patient', async () => {
    const attachment = await unscopedAttachment();
    await models.DocumentMetadata.create(
      fake(models.DocumentMetadata, {
        attachmentId: attachment.id,
        patientId: patient.id,
        encounterId: null,
      }),
    );

    await runBackfill();

    await attachment.reload();
    expect(attachment.patientId).toBe(patient.id);
    expect(attachment.encounterId).toBeFalsy();
  });

  it('recovers scope from a lab report attachment', async () => {
    const attachment = await unscopedAttachment();
    const labRequest = await models.LabRequest.create(
      fake(models.LabRequest, { encounterId: encounter.id }),
    );
    await models.LabRequestAttachment.create(
      fake(models.LabRequestAttachment, {
        labRequestId: labRequest.id,
        attachmentId: attachment.id,
      }),
    );

    await runBackfill();

    await attachment.reload();
    expect(attachment.patientId).toBe(patient.id);
    expect(attachment.encounterId).toBe(encounter.id);
  });

  // The photo arm joins on the answer body, which holds the attachment id as text
  // rather than through a foreign key.
  it('recovers scope from a survey photo answer', async () => {
    const attachment = await unscopedAttachment();
    const response = await models.SurveyResponse.create(
      fake(models.SurveyResponse, { surveyId: survey.id, encounterId: encounter.id }),
    );
    await models.SurveyResponseAnswer.create(
      fake(models.SurveyResponseAnswer, {
        responseId: response.id,
        dataElementId: dataElement.id,
        body: attachment.id,
      }),
    );

    await runBackfill();

    await attachment.reload();
    expect(attachment.patientId).toBe(patient.id);
    expect(attachment.encounterId).toBe(encounter.id);
  });

  // Scope is what lets an attachment leave central, so one that nothing references
  // has to keep none: unscoped is what keeps it central-only.
  it('leaves an attachment nothing references unscoped', async () => {
    const attachment = await unscopedAttachment();

    await runBackfill();

    await attachment.reload();
    expect(attachment.patientId).toBeFalsy();
    expect(attachment.encounterId).toBeFalsy();
  });

  it('does not overwrite scope an attachment already carries', async () => {
    const otherPatient = await models.Patient.create(await createDummyPatient(models));
    const attachment = await models.Attachment.create(
      fake(models.Attachment, {
        hash: `sha256:${randomUUID().replace(/-/g, '').repeat(2)}`,
        data: null,
        patientId: otherPatient.id,
        encounterId: null,
      }),
    );
    await models.DocumentMetadata.create(
      fake(models.DocumentMetadata, { attachmentId: attachment.id, encounterId: encounter.id }),
    );

    await runBackfill();

    await attachment.reload();
    expect(attachment.patientId).toBe(otherPatient.id);
  });
});
