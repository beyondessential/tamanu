import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake } from '@tamanu/fake-data/fake';

import { fetchPatientSummaryData } from '../../app/services/patientSummaryData';
import { createTestContext } from '../utilities';

describe('fetchPatientSummaryData', () => {
  let ctx;
  let models;
  let summary;

  const createLocation = async facilityFields => {
    const facility = await models.Facility.create(fake(models.Facility, facilityFields));
    return models.Location.create(fake(models.Location, { facilityId: facility.id }));
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;

    const network = await models.SensitiveNetwork.create(fake(models.SensitiveNetwork));
    const sensitiveLocation = await createLocation({ sensitiveNetworkId: network.id });
    const ordinaryLocation = await createLocation();

    const patient = await models.Patient.create(await createDummyPatient(models));
    const user = await models.User.create(fake(models.User));
    const medication = await models.ReferenceData.create(
      fake(models.ReferenceData, { type: 'drug' }),
    );

    const createEncounter = async (location, fields) =>
      models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
        locationId: location.id,
        ...fields,
      });
    const ordinaryEncounter = await createEncounter(ordinaryLocation, {
      startDate: '2026-01-01 09:00:00',
      endDate: '2026-01-02 09:00:00',
    });
    const sensitivePastEncounter = await createEncounter(sensitiveLocation, {
      startDate: '2026-02-01 09:00:00',
      endDate: '2026-02-02 09:00:00',
    });
    const sensitiveActiveEncounter = await createEncounter(sensitiveLocation, {
      startDate: '2026-03-01 09:00:00',
      endDate: null,
    });

    for (const [encounter, displayId] of [
      [ordinaryEncounter, 'LAB-ORDINARY'],
      [sensitivePastEncounter, 'LAB-SENSITIVE'],
    ]) {
      await models.LabRequest.create({
        ...fake(models.LabRequest),
        encounterId: encounter.id,
        requestedById: user.id,
        displayId,
      });
      await models.ImagingRequest.create(
        fake(models.ImagingRequest, {
          encounterId: encounter.id,
          requestedById: user.id,
          displayId: displayId.replace('LAB', 'IMG'),
        }),
      );
    }

    const createPrescription = notes =>
      models.Prescription.create(
        fake(models.Prescription, { prescriberId: user.id, medicationId: medication.id, notes }),
      );
    const ordinaryPrescription = await createPrescription('ordinary');
    await models.EncounterPrescription.create({
      encounterId: ordinaryEncounter.id,
      prescriptionId: ordinaryPrescription.id,
    });
    const sensitiveOngoingPrescription = await createPrescription('sensitive ongoing');
    await models.EncounterPrescription.create({
      encounterId: sensitiveActiveEncounter.id,
      prescriptionId: sensitiveOngoingPrescription.id,
    });
    await models.PatientOngoingPrescription.create({
      patientId: patient.id,
      prescriptionId: sensitiveOngoingPrescription.id,
    });
    const ongoingPrescription = await createPrescription('ongoing');
    await models.PatientOngoingPrescription.create({
      patientId: patient.id,
      prescriptionId: ongoingPrescription.id,
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
    const createLabRequestWithTests = async (displayId, labTestTypes) => {
      const request = await models.LabRequest.create({
        ...fake(models.LabRequest),
        encounterId: ordinaryEncounter.id,
        requestedById: user.id,
        displayId,
      });
      for (const labTestType of labTestTypes) {
        await models.LabTest.create(
          fake(models.LabTest, { labRequestId: request.id, labTestTypeId: labTestType.id }),
        );
      }
    };
    await createLabRequestWithTests('LAB-ORDINARY-TESTS', [ordinaryLabTestType]);
    await createLabRequestWithTests('LAB-SENSITIVE-TEST', [
      ordinaryLabTestType,
      sensitiveLabTestType,
    ]);

    const sensitiveDrug = await models.ReferenceData.create(
      fake(models.ReferenceData, { type: 'drug' }),
    );
    await models.ReferenceDrug.create(
      fake(models.ReferenceDrug, { referenceDataId: sensitiveDrug.id, isSensitive: true }),
    );
    const createSensitiveDrugPrescription = notes =>
      models.Prescription.create(
        fake(models.Prescription, {
          prescriberId: user.id,
          medicationId: sensitiveDrug.id,
          notes,
        }),
      );
    const sensitiveDrugEncounterPrescription = await createSensitiveDrugPrescription(
      'sensitive drug in encounter',
    );
    await models.EncounterPrescription.create({
      encounterId: ordinaryEncounter.id,
      prescriptionId: sensitiveDrugEncounterPrescription.id,
    });
    const sensitiveDrugOngoingPrescription =
      await createSensitiveDrugPrescription('sensitive drug ongoing');
    await models.PatientOngoingPrescription.create({
      patientId: patient.id,
      prescriptionId: sensitiveDrugOngoingPrescription.id,
    });

    summary = await fetchPatientSummaryData(patient.id, models);
  });
  afterAll(() => ctx.close());

  it('leaves out an active encounter at a facility in a sensitive network', () => {
    expect(summary.activeEncounter).toBeNull();
  });

  it('leaves out past encounters at a facility in a sensitive network', () => {
    expect(summary.pastEncounters.map(e => e.startDate)).toEqual(['2026-01-01 09:00:00']);
  });

  it('leaves out lab and imaging requests from those encounters', () => {
    expect(summary.labRequests.map(r => r.displayId)).not.toContain('LAB-SENSITIVE');
    expect(summary.imagingRequests.map(r => r.displayId)).toEqual(['IMG-ORDINARY']);
  });

  it('leaves out prescriptions linked to those encounters, even when ongoing', () => {
    expect(summary.medications.map(m => m.notes).sort()).toEqual(['ongoing', 'ordinary']);
  });

  it('leaves out lab requests holding a sensitive test', () => {
    expect(summary.labRequests.map(r => r.displayId).sort()).toEqual([
      'LAB-ORDINARY',
      'LAB-ORDINARY-TESTS',
    ]);
  });

  it('leaves out prescriptions of a sensitive drug, whether from an encounter or ongoing', () => {
    expect(summary.medications.map(m => m.notes)).not.toContain('sensitive drug in encounter');
    expect(summary.medications.map(m => m.notes)).not.toContain('sensitive drug ongoing');
  });
});
