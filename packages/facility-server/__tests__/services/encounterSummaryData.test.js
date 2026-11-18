import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake } from '@tamanu/fake-data/fake';

import { fetchEncounterSummaryData } from '../../app/services/encounterSummaryData';
import { createTestContext } from '../utilities';

describe('fetchEncounterSummaryData', () => {
  let ctx;
  let models;
  let summary;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;

    const patient = await models.Patient.create(await createDummyPatient(models));
    const user = await models.User.create(fake(models.User));
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });

    const labTestCategory = await models.ReferenceData.create(
      fake(models.ReferenceData, { type: 'labTestCategory' }),
    );
    const createLabTestType = isSensitive =>
      models.LabTestType.create(
        fake(models.LabTestType, { labTestCategoryId: labTestCategory.id, isSensitive }),
      );
    const ordinaryLabTestType = await createLabTestType(false);
    const sensitiveLabTestType = await createLabTestType(true);
    for (const [displayId, labTestTypes] of [
      ['LAB-ORDINARY', [ordinaryLabTestType]],
      ['LAB-SENSITIVE', [ordinaryLabTestType, sensitiveLabTestType]],
    ]) {
      const request = await models.LabRequest.create({
        ...fake(models.LabRequest),
        encounterId: encounter.id,
        requestedById: user.id,
        displayId,
      });
      for (const labTestType of labTestTypes) {
        await models.LabTest.create(
          fake(models.LabTest, { labRequestId: request.id, labTestTypeId: labTestType.id }),
        );
      }
    }

    for (const [notes, isSensitive] of [
      ['ordinary drug', false],
      ['sensitive drug', true],
    ]) {
      const drug = await models.ReferenceData.create(fake(models.ReferenceData, { type: 'drug' }));
      await models.ReferenceDrug.create(
        fake(models.ReferenceDrug, { referenceDataId: drug.id, isSensitive }),
      );
      const prescription = await models.Prescription.create(
        fake(models.Prescription, { prescriberId: user.id, medicationId: drug.id, notes }),
      );
      await models.EncounterPrescription.create({
        encounterId: encounter.id,
        prescriptionId: prescription.id,
      });
    }

    summary = await fetchEncounterSummaryData(encounter.id, models);
  });
  afterAll(() => ctx.close());

  it('leaves out lab requests holding a sensitive test', () => {
    expect(summary.labRequests.map(r => r.displayId)).toEqual(['LAB-ORDINARY']);
  });

  it('leaves out prescriptions of a sensitive drug', () => {
    expect(summary.medications.map(m => m.notes)).toEqual(['ordinary drug']);
  });
});
