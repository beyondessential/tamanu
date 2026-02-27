import { FACT_CURRENT_SYNC_TICK, FACT_LOOKUP_UP_TO_TICK } from '@tamanu/constants/facts';
import { fake } from '@tamanu/fake-data/fake';
import { NOTE_TYPES, REFERENCE_TYPES, SETTINGS_SCOPES, SYSTEM_USER_UUID } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import {
  createTestContext,
  waitForSession,
  initializeCentralSyncManagerWithContext,
} from '../utilities';

describe('CentralSyncManager Sensitive Facilities', () => {
  let ctx;
  let models;
  let patient;
  let practitioner;
  let sensitiveEncounter;
  let sensitiveFacility;
  let nonSensitiveEncounter;
  let nonSensitiveFacility;

  const DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS = 100000000;
  const initializeCentralSyncManager = config =>
    initializeCentralSyncManagerWithContext(ctx, config);

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models } = ctx.store);
  });

  beforeEach(async () => {
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 2);
    await models.SyncLookupTick.truncate({ force: true });
    await models.SyncDeviceTick.truncate({ force: true });
    await models.Facility.truncate({ cascade: true, force: true });
    await models.ReferenceData.truncate({ cascade: true, force: true });
    await models.User.truncate({ cascade: true, force: true });
    await models.User.create({
      id: SYSTEM_USER_UUID,
      email: 'system',
      displayName: 'System',
      role: 'system',
    });
    await models.Setting.set('audit.changes.enabled', false);
    await models.LocalSystemFact.set(FACT_LOOKUP_UP_TO_TICK, null);
    await models.SyncLookup.truncate({ force: true });
    await models.DebugLog.truncate({ force: true });
    await models.ReferenceData.bulkCreate([
      {
        id: NOTE_TYPES.OTHER,
        code: 'other',
        name: 'Other',
        type: REFERENCE_TYPES.NOTE_TYPE,
        visibilityStatus: 'current',
        systemRequired: true,
      },
      {
        id: NOTE_TYPES.SYSTEM,
        code: 'system',
        name: 'System',
        type: REFERENCE_TYPES.NOTE_TYPE,
        visibilityStatus: 'current',
        systemRequired: true,
      },
    ]);
  });

  afterAll(() => ctx.close());

  const lookupEnabledConfig = {
    sync: {
      lookupTable: {
        enabled: true,
      },
      maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
    },
  };

  beforeEach(async () => {
    patient = await models.Patient.create(fake(models.Patient));
    practitioner = await models.User.create(fake(models.User));
    // Reset modules to ensure fresh imports
    jest.resetModules();
    // The config override actually doesn't apply to snapshotOutgoingChanges which uses the test.json, so we need to mock it directly here
    jest.doMock('@tamanu/shared/utils/withConfig', () => ({
      withConfig: fn => {
        const inner = function inner(...args) {
          return fn(...args, lookupEnabledConfig);
        };
        inner.overrideConfig = fn;
        return inner;
      },
    }));

    sensitiveFacility = await models.Facility.create(fake(models.Facility, { isSensitive: true }));
    const sensitiveDepartment = await models.Department.create(
      fake(models.Department, { facilityId: sensitiveFacility.id }),
    );
    const sensitiveLocation = await models.Location.create(
      fake(models.Location, { facilityId: sensitiveFacility.id }),
    );
    sensitiveEncounter = await models.Encounter.create({
      ...fake(models.Encounter),
      patientId: patient.id,
      locationId: sensitiveLocation.id,
      departmentId: sensitiveDepartment.id,
      examinerId: practitioner.id,
      endDate: null,
    });
    nonSensitiveFacility = await models.Facility.create(
      fake(models.Facility, { isSensitive: false }),
    );
    const nonSensitiveDepartment = await models.Department.create(
      fake(models.Department, { facilityId: nonSensitiveFacility.id }),
    );
    const nonSensitiveLocation = await models.Location.create(
      fake(models.Location, { facilityId: nonSensitiveFacility.id }),
    );
    nonSensitiveEncounter = await models.Encounter.create({
      ...fake(models.Encounter),
      patientId: patient.id,
      locationId: nonSensitiveLocation.id,
      departmentId: nonSensitiveDepartment.id,
      examinerId: practitioner.id,
      endDate: null,
    });
  });

  const getOutgoingIdsForRecordType = async (centralSyncManager, facilityId, recordType) => {
    const { sessionId } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, sessionId);

    await centralSyncManager.setupSnapshotForPull(
      sessionId,
      {
        since: 1,
        facilityIds: [facilityId],
      },
      () => true,
    );

    const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});
    return outgoingChanges.filter(c => c.recordType === recordType).map(c => c.recordId);
  };

  it('will populate the lookup table with a facility id appropriately for sensitive encounters', async () => {
    const centralSyncManager = initializeCentralSyncManager(lookupEnabledConfig);
    await centralSyncManager.updateLookupTable();

    const lookupData = await models.SyncLookup.findAll();
    const sensitiveLookupRecord = lookupData.find(l => l.recordId === sensitiveEncounter.id);
    const nonSensitiveLookupRecord = lookupData.find(l => l.recordId === nonSensitiveEncounter.id);

    expect(sensitiveLookupRecord.facilityId).toBe(sensitiveFacility.id);
    expect(nonSensitiveLookupRecord.facilityId).toBeNull();
  });

  it('will sync sensitive encounters to itself', async () => {
    const centralSyncManager = initializeCentralSyncManager(lookupEnabledConfig);
    await centralSyncManager.updateLookupTable();

    const encounterIds = await getOutgoingIdsForRecordType(
      centralSyncManager,
      sensitiveFacility.id,
      'encounters',
    );
    expect(encounterIds).toContain(sensitiveEncounter.id);
    expect(encounterIds).toContain(nonSensitiveEncounter.id);
  });

  describe('check sensitive encounter linked data types are not syncing to any other facility', () => {
    // Every test in this describe block should use this function to check that the sensitive record
    // is not synced to the non-sensitive facility
    const checkSensitiveRecordFiltering = async ({ model, sensitiveId, nonSensitiveId }) => {
      const centralSyncManager = initializeCentralSyncManager(lookupEnabledConfig);
      await centralSyncManager.updateLookupTable();

      const recordIds = await getOutgoingIdsForRecordType(
        centralSyncManager,
        nonSensitiveFacility.id,
        model.tableName,
      );

      if (recordIds.length === 0) {
        throw new Error(
          `No records found for record type ${model.tableName} in lookup table, Check the test setup!`,
        );
      }

      expect(recordIds).not.toContain(sensitiveId);
      expect(recordIds).toContain(nonSensitiveId);
    };

    // Basic encounter
    it("won't sync sensitive encounters", async () => {
      await checkSensitiveRecordFiltering({
        model: models.Encounter,
        sensitiveId: sensitiveEncounter.id,
        nonSensitiveId: nonSensitiveEncounter.id,
      });
    });

    it("won't sync sensitive encounter triage", async () => {
      const triagePatientA = await models.Patient.create(fake(models.Patient));
      const triagePatientB = await models.Patient.create(fake(models.Patient));
      const sensitiveTriage = await models.Triage.create({
        ...fake(models.Triage),
        patientId: triagePatientA.id,
        departmentId: sensitiveEncounter.departmentId,
        locationId: sensitiveEncounter.locationId,
        practitionerId: sensitiveEncounter.examinerId,
        triageTime: getCurrentDateTimeString(),
      });
      const nonSensitiveTriage = await models.Triage.create({
        ...fake(models.Triage),
        patientId: triagePatientB.id,
        departmentId: nonSensitiveEncounter.departmentId,
        locationId: nonSensitiveEncounter.locationId,
        practitionerId: nonSensitiveEncounter.examinerId,
        triageTime: getCurrentDateTimeString(),
      });

      await checkSensitiveRecordFiltering({
        model: models.Encounter,
        sensitiveId: sensitiveTriage.encounterId,
        nonSensitiveId: nonSensitiveTriage.encounterId,
      });

      await checkSensitiveRecordFiltering({
        model: models.Triage,
        sensitiveId: sensitiveTriage.id,
        nonSensitiveId: nonSensitiveTriage.id,
      });
    });

    it("won't sync sensitive encounter discharge", async () => {
      const sensitiveDischarge = await models.Discharge.create(
        fake(models.Discharge, {
          encounterId: sensitiveEncounter.id,
        }),
      );
      const nonSensitiveDischarge = await models.Discharge.create(
        fake(models.Discharge, {
          encounterId: nonSensitiveEncounter.id,
        }),
      );
      await checkSensitiveRecordFiltering({
        model: models.Discharge,
        sensitiveId: sensitiveDischarge.id,
        nonSensitiveId: nonSensitiveDischarge.id,
      });
    });

    it("won't sync sensitive encounter history", async () => {
      const sensitiveEncounterHistory = await models.EncounterHistory.findOne({
        where: {
          encounterId: sensitiveEncounter.id,
        },
      });
      const nonSensitiveEncounterHistory = await models.EncounterHistory.findOne({
        where: {
          encounterId: nonSensitiveEncounter.id,
        },
      });
      await checkSensitiveRecordFiltering({
        model: models.EncounterHistory,
        sensitiveId: sensitiveEncounterHistory.id,
        nonSensitiveId: nonSensitiveEncounterHistory.id,
      });
    });

    it("won't sync sensitive encounter procedures", async () => {
      // Create procedures linked to encounters
      const sensitiveProcedure = await models.Procedure.create(
        fake(models.Procedure, {
          encounterId: sensitiveEncounter.id,
        }),
      );
      const nonSensitiveProcedure = await models.Procedure.create(
        fake(models.Procedure, {
          encounterId: nonSensitiveEncounter.id,
        }),
      );

      await checkSensitiveRecordFiltering({
        model: models.Procedure,
        sensitiveId: sensitiveProcedure.id,
        nonSensitiveId: nonSensitiveProcedure.id,
      });
    });

    it("won't sync sensitive encounter notes", async () => {
      // Create notes linked to encounters
      const sensitiveNote = await models.Note.create(
        fake(models.Note, {
          recordId: sensitiveEncounter.id,
          recordType: 'Encounter',
          noteTypeId: NOTE_TYPES.OTHER,
        }),
      );
      const nonSensitiveNote = await models.Note.create(
        fake(models.Note, {
          recordId: nonSensitiveEncounter.id,
          recordType: 'Encounter',
          noteTypeId: NOTE_TYPES.OTHER,
        }),
      );

      await checkSensitiveRecordFiltering({
        model: models.Note,
        sensitiveId: sensitiveNote.id,
        nonSensitiveId: nonSensitiveNote.id,
      });
    });

    it("won't sync sensitive encounter diagnoses", async () => {
      const sensitiveDiagnosis = await models.EncounterDiagnosis.create(
        fake(models.EncounterDiagnosis, {
          encounterId: sensitiveEncounter.id,
          diagnosisId: (await models.ReferenceData.create(fake(models.ReferenceData))).id,
        }),
      );
      const nonSensitiveDiagnosis = await models.EncounterDiagnosis.create(
        fake(models.EncounterDiagnosis, {
          encounterId: nonSensitiveEncounter.id,
          diagnosisId: (await models.ReferenceData.create(fake(models.ReferenceData))).id,
        }),
      );

      await checkSensitiveRecordFiltering({
        model: models.EncounterDiagnosis,
        sensitiveId: sensitiveDiagnosis.id,
        nonSensitiveId: nonSensitiveDiagnosis.id,
      });
    });

    it("won't sync sensitive encounter tasks", async () => {
      const sensitiveTask = await models.Task.create(
        fake(models.Task, {
          encounterId: sensitiveEncounter.id,
          requestedByUserId: practitioner.id,
        }),
      );
      const nonSensitiveTask = await models.Task.create(
        fake(models.Task, {
          encounterId: nonSensitiveEncounter.id,
          requestedByUserId: practitioner.id,
        }),
      );

      await checkSensitiveRecordFiltering({
        model: models.Task,
        sensitiveId: sensitiveTask.id,
        nonSensitiveId: nonSensitiveTask.id,
      });
    });

    it("won't sync sensitive encounter encounter diets", async () => {
      const sensitiveDiet = await models.EncounterDiet.create(
        fake(models.EncounterDiet, {
          encounterId: sensitiveEncounter.id,
          dietId: (await models.ReferenceData.create(fake(models.ReferenceData))).id,
        }),
      );
      const nonSensitiveDiet = await models.EncounterDiet.create(
        fake(models.EncounterDiet, {
          encounterId: nonSensitiveEncounter.id,
          dietId: (await models.ReferenceData.create(fake(models.ReferenceData))).id,
        }),
      );

      await checkSensitiveRecordFiltering({
        model: models.EncounterDiet,
        sensitiveId: sensitiveDiet.id,
        nonSensitiveId: nonSensitiveDiet.id,
      });
    });

    it("won't sync sensitive encounter administered vaccines", async () => {
      const sensitiveAdministeredVaccine = await models.AdministeredVaccine.create(
        fake(models.AdministeredVaccine, {
          encounterId: sensitiveEncounter.id,
          scheduledVaccineId: (await models.ScheduledVaccine.create(fake(models.ScheduledVaccine)))
            .id,
        }),
      );
      const nonSensitiveAdministeredVaccine = await models.AdministeredVaccine.create(
        fake(models.AdministeredVaccine, {
          encounterId: nonSensitiveEncounter.id,
          scheduledVaccineId: (await models.ScheduledVaccine.create(fake(models.ScheduledVaccine)))
            .id,
        }),
      );

      await checkSensitiveRecordFiltering({
        model: models.AdministeredVaccine,
        sensitiveId: sensitiveAdministeredVaccine.id,
        nonSensitiveId: nonSensitiveAdministeredVaccine.id,
      });
    });

    it("won't sync sensitive encounter appointments", async () => {
      const sensitiveAppointment = await models.Appointment.create(
        fake(models.Appointment, {
          patientId: patient.id,
          locationId: sensitiveEncounter.locationId,
        }),
      );
      const nonSensitiveAppointment = await models.Appointment.create(
        fake(models.Appointment, {
          patientId: patient.id,
          locationId: nonSensitiveEncounter.locationId,
        }),
      );

      await checkSensitiveRecordFiltering({
        model: models.Appointment,
        sensitiveId: sensitiveAppointment.id,
        nonSensitiveId: nonSensitiveAppointment.id,
      });
    });

    it("won't sync sensitive encounter document metadata", async () => {
      const sensitiveDocumentMetadata = await models.DocumentMetadata.create(
        fake(models.DocumentMetadata, {
          encounterId: sensitiveEncounter.id,
        }),
      );
      const nonSensitiveDocumentMetadata = await models.DocumentMetadata.create(
        fake(models.DocumentMetadata, {
          encounterId: nonSensitiveEncounter.id,
        }),
      );
      await checkSensitiveRecordFiltering({
        model: models.DocumentMetadata,
        sensitiveId: sensitiveDocumentMetadata.id,
        nonSensitiveId: nonSensitiveDocumentMetadata.id,
      });
    });

    describe('Program/Survey clinical data', () => {
      let sensitiveSurveyResponse;
      let nonSensitiveSurveyResponse;
      let sensitiveSurveyResponseAnswer;
      let nonSensitiveSurveyResponseAnswer;

      beforeEach(async () => {
        sensitiveSurveyResponse = await models.SurveyResponse.create(
          fake(models.SurveyResponse, {
            encounterId: sensitiveEncounter.id,
          }),
        );
        nonSensitiveSurveyResponse = await models.SurveyResponse.create(
          fake(models.SurveyResponse, {
            encounterId: nonSensitiveEncounter.id,
          }),
        );

        sensitiveSurveyResponseAnswer = await models.SurveyResponseAnswer.create(
          fake(models.SurveyResponseAnswer, {
            responseId: sensitiveSurveyResponse.id,
          }),
        );
        nonSensitiveSurveyResponseAnswer = await models.SurveyResponseAnswer.create(
          fake(models.SurveyResponseAnswer, {
            responseId: nonSensitiveSurveyResponse.id,
          }),
        );
      });

      it("won't sync sensitive encounter survey responses", async () => {
        await checkSensitiveRecordFiltering({
          model: models.SurveyResponse,
          sensitiveId: sensitiveSurveyResponse.id,
          nonSensitiveId: nonSensitiveSurveyResponse.id,
        });
      });

      it("won't sync sensitive encounter survey response answers", async () => {
        await checkSensitiveRecordFiltering({
          model: models.SurveyResponseAnswer,
          sensitiveId: sensitiveSurveyResponseAnswer.id,
          nonSensitiveId: nonSensitiveSurveyResponseAnswer.id,
        });
      });

      it("won't sync sensitive encounter referrals", async () => {
        const sensitiveReferral = await models.Referral.create(
          fake(models.Referral, {
            initiatingEncounterId: sensitiveEncounter.id,
          }),
        );
        const nonSensitiveReferral = await models.Referral.create(
          fake(models.Referral, {
            initiatingEncounterId: nonSensitiveEncounter.id,
          }),
        );
        await checkSensitiveRecordFiltering({
          model: models.Referral,
          sensitiveId: sensitiveReferral.id,
          nonSensitiveId: nonSensitiveReferral.id,
        });
      });

      it("won't sync sensitive encounter vital logs", async () => {
        const sensitiveVitalLog = await models.VitalLog.create(
          fake(models.VitalLog, {
            answerId: sensitiveSurveyResponseAnswer.id,
          }),
        );
        const nonSensitiveVitalLog = await models.VitalLog.create(
          fake(models.VitalLog, {
            answerId: nonSensitiveSurveyResponseAnswer.id,
          }),
        );
        await checkSensitiveRecordFiltering({
          model: models.VitalLog,
          sensitiveId: sensitiveVitalLog.id,
          nonSensitiveId: nonSensitiveVitalLog.id,
        });
      });
    });

    describe('Imaging clinical data', () => {
      let sensitiveImagingRequest;
      let nonSensitiveImagingRequest;

      beforeEach(async () => {
        sensitiveImagingRequest = await models.ImagingRequest.create(
          fake(models.ImagingRequest, {
            encounterId: sensitiveEncounter.id,
            requestedById: practitioner.id,
          }),
        );
        nonSensitiveImagingRequest = await models.ImagingRequest.create(
          fake(models.ImagingRequest, {
            encounterId: nonSensitiveEncounter.id,
            requestedById: practitioner.id,
          }),
        );
      });

      it("won't sync sensitive encounter imaging requests", async () => {
        await checkSensitiveRecordFiltering({
          model: models.ImagingRequest,
          sensitiveId: sensitiveImagingRequest.id,
          nonSensitiveId: nonSensitiveImagingRequest.id,
        });
      });
      it("won't sync sensitive encounter imaging results", async () => {
        const sensitiveImagingResult = await models.ImagingResult.create(
          fake(models.ImagingResult, {
            imagingRequestId: sensitiveImagingRequest.id,
          }),
        );
        const nonSensitiveImagingResult = await models.ImagingResult.create(
          fake(models.ImagingResult, {
            imagingRequestId: nonSensitiveImagingRequest.id,
          }),
        );
        await checkSensitiveRecordFiltering({
          model: models.ImagingResult,
          sensitiveId: sensitiveImagingResult.id,
          nonSensitiveId: nonSensitiveImagingResult.id,
        });
      });
      it("won't sync sensitive encounter imaging request areas", async () => {
        const sensitiveImagingRequestArea = await models.ImagingRequestArea.create(
          fake(models.ImagingRequestArea, {
            imagingRequestId: sensitiveImagingRequest.id,
            areaId: (await models.ReferenceData.create(fake(models.ReferenceData))).id,
          }),
        );
        const nonSensitiveImagingRequestArea = await models.ImagingRequestArea.create(
          fake(models.ImagingRequestArea, {
            imagingRequestId: nonSensitiveImagingRequest.id,
            areaId: (await models.ReferenceData.create(fake(models.ReferenceData))).id,
          }),
        );
        await checkSensitiveRecordFiltering({
          model: models.ImagingRequestArea,
          sensitiveId: sensitiveImagingRequestArea.id,
          nonSensitiveId: nonSensitiveImagingRequestArea.id,
        });
      });
    });

    describe('Medication clinical data', () => {
      let sensitivePrescription;
      let nonSensitivePrescription;
      let sensitiveEncounterPrescription;
      let nonSensitiveEncounterPrescription;
      let sensitiveMedicationAdministrationRecord;
      let nonSensitiveMedicationAdministrationRecord;

      beforeEach(async () => {
        sensitivePrescription = await models.Prescription.create(fake(models.Prescription));
        nonSensitivePrescription = await models.Prescription.create(fake(models.Prescription));

        sensitiveEncounterPrescription = await models.EncounterPrescription.create(
          fake(models.EncounterPrescription, {
            encounterId: sensitiveEncounter.id,
            prescriptionId: sensitivePrescription.id,
          }),
        );
        nonSensitiveEncounterPrescription = await models.EncounterPrescription.create(
          fake(models.EncounterPrescription, {
            encounterId: nonSensitiveEncounter.id,
            prescriptionId: nonSensitivePrescription.id,
          }),
        );

        sensitiveMedicationAdministrationRecord =
          await models.MedicationAdministrationRecord.create(
            fake(models.MedicationAdministrationRecord, {
              prescriptionId: sensitivePrescription.id,
            }),
          );

        nonSensitiveMedicationAdministrationRecord =
          await models.MedicationAdministrationRecord.create(
            fake(models.MedicationAdministrationRecord, {
              prescriptionId: nonSensitivePrescription.id,
            }),
          );
      });

      it("won't sync sensitive prescriptions", async () => {
        await checkSensitiveRecordFiltering({
          model: models.Prescription,
          sensitiveId: sensitivePrescription.id,
          nonSensitiveId: nonSensitivePrescription.id,
        });
      });

      it("won't sync sensitive encounter prescriptions", async () => {
        await checkSensitiveRecordFiltering({
          model: models.EncounterPrescription,
          sensitiveId: sensitiveEncounterPrescription.id,
          nonSensitiveId: nonSensitiveEncounterPrescription.id,
        });
      });

      it("won't sync sensitive encounter pause prescriptions", async () => {
        const sensitiveEncounterPausePrescription = await models.EncounterPausePrescription.create(
          fake(models.EncounterPausePrescription, {
            encounterPrescriptionId: sensitiveEncounterPrescription.id,
          }),
        );
        const nonSensitiveEncounterPausePrescription =
          await models.EncounterPausePrescription.create(
            fake(models.EncounterPausePrescription, {
              encounterPrescriptionId: nonSensitiveEncounterPrescription.id,
            }),
          );

        const sensitiveEncounterPausePrescriptionHistory =
          await models.EncounterPausePrescriptionHistory.findOne({
            where: {
              encounterPrescriptionId: sensitiveEncounterPrescription.id,
            },
          });
        const nonSensitiveEncounterPausePrescriptionHistory =
          await models.EncounterPausePrescriptionHistory.findOne({
            where: {
              encounterPrescriptionId: nonSensitiveEncounterPrescription.id,
            },
          });

        await checkSensitiveRecordFiltering({
          model: models.EncounterPausePrescription,
          sensitiveId: sensitiveEncounterPausePrescription.id,
          nonSensitiveId: nonSensitiveEncounterPausePrescription.id,
        });

        await checkSensitiveRecordFiltering({
          model: models.EncounterPausePrescriptionHistory,
          sensitiveId: sensitiveEncounterPausePrescriptionHistory.id,
          nonSensitiveId: nonSensitiveEncounterPausePrescriptionHistory.id,
        });
      });

      it("won't sync sensitive medication administration records", async () => {
        await checkSensitiveRecordFiltering({
          model: models.MedicationAdministrationRecord,
          sensitiveId: sensitiveMedicationAdministrationRecord.id,
          nonSensitiveId: nonSensitiveMedicationAdministrationRecord.id,
        });
      });

      it("won't sync sensitive medication administration record doses", async () => {
        const sensitiveMedicationAdministrationRecordDose =
          await models.MedicationAdministrationRecordDose.create(
            fake(models.MedicationAdministrationRecordDose, {
              marId: sensitiveMedicationAdministrationRecord.id,
              recordedByUserId: practitioner.id,
              givenByUserId: practitioner.id,
            }),
          );
        const nonSensitiveMedicationAdministrationRecordDose =
          await models.MedicationAdministrationRecordDose.create(
            fake(models.MedicationAdministrationRecordDose, {
              marId: nonSensitiveMedicationAdministrationRecord.id,
              recordedByUserId: practitioner.id,
              givenByUserId: practitioner.id,
            }),
          );

        await checkSensitiveRecordFiltering({
          model: models.MedicationAdministrationRecordDose,
          sensitiveId: sensitiveMedicationAdministrationRecordDose.id,
          nonSensitiveId: nonSensitiveMedicationAdministrationRecordDose.id,
        });
      });
    });

    describe('Invoice clinical data', () => {
      let sensitiveInvoice;
      let nonSensitiveInvoice;
      let sensitiveInvoiceItem;
      let nonSensitiveInvoiceItem;

      beforeEach(async () => {
        sensitiveInvoice = await models.Invoice.create(
          fake(models.Invoice, {
            encounterId: sensitiveEncounter.id,
          }),
        );
        nonSensitiveInvoice = await models.Invoice.create(
          fake(models.Invoice, {
            encounterId: nonSensitiveEncounter.id,
          }),
        );
        sensitiveInvoiceItem = await models.InvoiceItem.create(
          fake(models.InvoiceItem, {
            invoiceId: sensitiveInvoice.id,
            orderedByUserId: practitioner.id,
          }),
        );
        nonSensitiveInvoiceItem = await models.InvoiceItem.create(
          fake(models.InvoiceItem, {
            invoiceId: nonSensitiveInvoice.id,
            orderedByUserId: practitioner.id,
          }),
        );
      });

      it("won't sync sensitive encounter invoice", async () => {
        await checkSensitiveRecordFiltering({
          model: models.Invoice,
          sensitiveId: sensitiveInvoice.id,
          nonSensitiveId: nonSensitiveInvoice.id,
        });
      });

      it("won't sync sensitive encounter invoice items", async () => {
        await checkSensitiveRecordFiltering({
          model: models.InvoiceItem,
          sensitiveId: sensitiveInvoiceItem.id,
          nonSensitiveId: nonSensitiveInvoiceItem.id,
        });
      });

      it("won't sync sensitive encounter invoice payments", async () => {
        const sensitiveInvoicePayment = await models.InvoicePayment.create(
          fake(models.InvoicePayment, {
            invoiceId: sensitiveInvoice.id,
          }),
        );
        const nonSensitiveInvoicePayment = await models.InvoicePayment.create(
          fake(models.InvoicePayment, {
            invoiceId: nonSensitiveInvoice.id,
          }),
        );
        await checkSensitiveRecordFiltering({
          model: models.InvoicePayment,
          sensitiveId: sensitiveInvoicePayment.id,
          nonSensitiveId: nonSensitiveInvoicePayment.id,
        });
      });

      it("won't sync sensitive encounter invoice insurer payments", async () => {
        const sensitiveInvoicePayment = await models.InvoicePayment.create(
          fake(models.InvoicePayment, {
            invoiceId: sensitiveInvoice.id,
          }),
        );
        const nonSensitiveInvoicePayment = await models.InvoicePayment.create(
          fake(models.InvoicePayment, {
            invoiceId: nonSensitiveInvoice.id,
          }),
        );

        const sensitiveInsurerPayment = await models.InvoiceInsurerPayment.create(
          fake(models.InvoiceInsurerPayment, {
            invoicePaymentId: sensitiveInvoicePayment.id,
          }),
        );
        const nonSensitiveInsurerPayment = await models.InvoiceInsurerPayment.create(
          fake(models.InvoiceInsurerPayment, {
            invoicePaymentId: nonSensitiveInvoicePayment.id,
          }),
        );

        await checkSensitiveRecordFiltering({
          model: models.InvoiceInsurerPayment,
          sensitiveId: sensitiveInsurerPayment.id,
          nonSensitiveId: nonSensitiveInsurerPayment.id,
        });
      });

      it("won't sync sensitive encounter invoice patient payments", async () => {
        const sensitiveInvoicePayment = await models.InvoicePayment.create(
          fake(models.InvoicePayment, {
            invoiceId: sensitiveInvoice.id,
          }),
        );
        const nonSensitiveInvoicePayment = await models.InvoicePayment.create(
          fake(models.InvoicePayment, {
            invoiceId: nonSensitiveInvoice.id,
          }),
        );

        const sensitivePatientPayment = await models.InvoicePatientPayment.create(
          fake(models.InvoicePatientPayment, {
            invoicePaymentId: sensitiveInvoicePayment.id,
          }),
        );
        const nonSensitivePatientPayment = await models.InvoicePatientPayment.create(
          fake(models.InvoicePatientPayment, {
            invoicePaymentId: nonSensitiveInvoicePayment.id,
          }),
        );

        await checkSensitiveRecordFiltering({
          model: models.InvoicePatientPayment,
          sensitiveId: sensitivePatientPayment.id,
          nonSensitiveId: nonSensitivePatientPayment.id,
        });
      });

      it("won't sync sensitive encounter invoice item discounts", async () => {
        const sensitiveItemDiscount = await models.InvoiceItemDiscount.create(
          fake(models.InvoiceItemDiscount, {
            invoiceItemId: sensitiveInvoiceItem.id,
          }),
        );
        const nonSensitiveItemDiscount = await models.InvoiceItemDiscount.create(
          fake(models.InvoiceItemDiscount, {
            invoiceItemId: nonSensitiveInvoiceItem.id,
          }),
        );

        await checkSensitiveRecordFiltering({
          model: models.InvoiceItemDiscount,
          sensitiveId: sensitiveItemDiscount.id,
          nonSensitiveId: nonSensitiveItemDiscount.id,
        });
      });

      it("won't sync sensitive encounter invoice discounts", async () => {
        const sensitiveInvoiceDiscount = await models.InvoiceDiscount.create(
          fake(models.InvoiceDiscount, {
            invoiceId: sensitiveInvoice.id,
            appliedByUserId: practitioner.id,
          }),
        );
        const nonSensitiveInvoiceDiscount = await models.InvoiceDiscount.create(
          fake(models.InvoiceDiscount, {
            invoiceId: nonSensitiveInvoice.id,
            appliedByUserId: practitioner.id,
          }),
        );

        await checkSensitiveRecordFiltering({
          model: models.InvoiceDiscount,
          sensitiveId: sensitiveInvoiceDiscount.id,
          nonSensitiveId: nonSensitiveInvoiceDiscount.id,
        });
      });

      it("won't sync sensitive encounter invoice insurance contracts", async () => {
        const contractA = await models.InvoiceInsurancePlan.create(
          fake(models.InvoiceInsurancePlan),
        );
        const contractB = await models.InvoiceInsurancePlan.create(
          fake(models.InvoiceInsurancePlan),
        );
        const sensitiveLink = await models.InvoicesInvoiceInsurancePlan.create(
          fake(models.InvoicesInvoiceInsurancePlan, {
            invoiceId: sensitiveInvoice.id,
            invoiceInsurancePlanId: contractA.id,
          }),
        );
        const nonSensitiveLink = await models.InvoicesInvoiceInsurancePlan.create(
          fake(models.InvoicesInvoiceInsurancePlan, {
            invoiceId: nonSensitiveInvoice.id,
            invoiceInsurancePlanId: contractB.id,
          }),
        );

        await checkSensitiveRecordFiltering({
          model: models.InvoicesInvoiceInsurancePlan,
          sensitiveId: sensitiveLink.id,
          nonSensitiveId: nonSensitiveLink.id,
        });
      });
    });

    describe('Lab clinical data', () => {
      let sensitiveLabRequest;
      let nonSensitiveLabRequest;

      beforeEach(async () => {
        sensitiveLabRequest = await models.LabRequest.create(
          fake(models.LabRequest, {
            encounterId: sensitiveEncounter.id,
          }),
        );
        nonSensitiveLabRequest = await models.LabRequest.create(
          fake(models.LabRequest, {
            encounterId: nonSensitiveEncounter.id,
          }),
        );
      });

      it("won't sync sensitive encounter lab requests", async () => {
        await checkSensitiveRecordFiltering({
          model: models.LabRequest,
          sensitiveId: sensitiveLabRequest.id,
          nonSensitiveId: nonSensitiveLabRequest.id,
        });
      });

      it("won't sync sensitive encounter lab tests", async () => {
        const sensitiveLabTest = await models.LabTest.create(
          fake(models.LabTest, {
            labRequestId: sensitiveLabRequest.id,
          }),
        );
        const nonSensitiveLabTest = await models.LabTest.create(
          fake(models.LabTest, {
            labRequestId: nonSensitiveLabRequest.id,
          }),
        );

        await checkSensitiveRecordFiltering({
          model: models.LabTest,
          sensitiveId: sensitiveLabTest.id,
          nonSensitiveId: nonSensitiveLabTest.id,
        });
      });

      it("won't sync sensitive encounter lab request attachments", async () => {
        const sensitiveLabRequestAttachment = await models.LabRequestAttachment.create(
          fake(models.LabRequestAttachment, {
            labRequestId: sensitiveLabRequest.id,
          }),
        );
        const nonSensitiveLabRequestAttachment = await models.LabRequestAttachment.create(
          fake(models.LabRequestAttachment, {
            labRequestId: nonSensitiveLabRequest.id,
          }),
        );
        await checkSensitiveRecordFiltering({
          model: models.LabRequestAttachment,
          sensitiveId: sensitiveLabRequestAttachment.id,
          nonSensitiveId: nonSensitiveLabRequestAttachment.id,
        });
      });

      it("won't sync sensitive encounter lab test panel requests", async () => {
        const sensitiveLabTestPanelRequest = await models.LabTestPanelRequest.create(
          fake(models.LabTestPanelRequest, {
            encounterId: sensitiveEncounter.id,
            labTestPanelId: (await models.LabTestPanel.create(fake(models.LabTestPanel))).id,
          }),
        );
        const nonSensitiveLabTestPanelRequest = await models.LabTestPanelRequest.create(
          fake(models.LabTestPanelRequest, {
            encounterId: nonSensitiveEncounter.id,
            labTestPanelId: (await models.LabTestPanel.create(fake(models.LabTestPanel))).id,
          }),
        );
        await checkSensitiveRecordFiltering({
          model: models.LabTestPanelRequest,
          sensitiveId: sensitiveLabTestPanelRequest.id,
          nonSensitiveId: nonSensitiveLabTestPanelRequest.id,
        });
      });

      it("won't sync sensitive encounter lab request logs", async () => {
        const sensitiveLabRequestLog = await models.LabRequestLog.create(
          fake(models.LabRequestLog, {
            labRequestId: sensitiveLabRequest.id,
          }),
        );
        const nonSensitiveLabRequestLog = await models.LabRequestLog.create(
          fake(models.LabRequestLog, {
            labRequestId: nonSensitiveLabRequest.id,
          }),
        );
        await checkSensitiveRecordFiltering({
          model: models.LabRequestLog,
          sensitiveId: sensitiveLabRequestLog.id,
          nonSensitiveId: nonSensitiveLabRequestLog.id,
        });
      });

      it('will sync sensitive lab requests to any facility with syncAllLabRequests enabled', async () => {
        await models.Setting.create({
          facilityId: nonSensitiveFacility.id,
          key: 'sync.syncAllLabRequests',
          value: true,
          scope: SETTINGS_SCOPES.FACILITY,
        });

        const centralSyncManager = initializeCentralSyncManager(lookupEnabledConfig);
        await centralSyncManager.updateLookupTable();

        const labRequestIds = await getOutgoingIdsForRecordType(
          centralSyncManager,
          sensitiveFacility.id,
          models.LabRequest.tableName,
        );
        expect(labRequestIds).toContain(sensitiveLabRequest.id);
        expect(labRequestIds).toContain(nonSensitiveLabRequest.id);
      });
    });
  });

  describe('edge cases', () => {
    it("won't sync between facilities just because they are both sensitive", async () => {
      const sensitiveFacilityA = await models.Facility.create(
        fake(models.Facility, {
          isSensitive: true,
        }),
      );
      const sensitiveFacilityB = await models.Facility.create(
        fake(models.Facility, {
          isSensitive: true,
        }),
      );
      const sensitiveLocationA = await models.Location.create(
        fake(models.Location, {
          facilityId: sensitiveFacilityA.id,
        }),
      );
      const sensitiveDepartmentA = await models.Department.create(
        fake(models.Department, {
          facilityId: sensitiveFacilityA.id,
        }),
      );
      const sensitiveLocationB = await models.Location.create(
        fake(models.Location, {
          facilityId: sensitiveFacilityB.id,
        }),
      );
      const sensitiveDepartmentB = await models.Department.create(
        fake(models.Department, {
          facilityId: sensitiveFacilityB.id,
        }),
      );
      const sensitiveEncounterA = await models.Encounter.create({
        ...fake(models.Encounter),
        patientId: patient.id,
        locationId: sensitiveLocationA.id,
        departmentId: sensitiveDepartmentA.id,
        examinerId: practitioner.id,
        endDate: null,
      });
      const sensitiveEncounterB = await models.Encounter.create({
        ...fake(models.Encounter),
        patientId: patient.id,
        locationId: sensitiveLocationB.id,
        departmentId: sensitiveDepartmentB.id,
        examinerId: practitioner.id,
        endDate: null,
      });

      const centralSyncManager = initializeCentralSyncManager(lookupEnabledConfig);
      await centralSyncManager.updateLookupTable();

      const { sessionId } = await centralSyncManager.startSession();
      await waitForSession(centralSyncManager, sessionId);

      await centralSyncManager.setupSnapshotForPull(
        sessionId,
        {
          since: 1,
          facilityIds: [sensitiveFacilityA.id],
        },
        () => true,
      );

      const outgoingChanges = await centralSyncManager.getOutgoingChanges(sessionId, {});
      const encounterIds = outgoingChanges
        .filter(c => c.recordType === 'encounters')
        .map(c => c.recordId);

      expect(encounterIds).toContain(sensitiveEncounterA.id);
      expect(encounterIds).not.toContain(sensitiveEncounterB.id);
    });

    it('will keep historical sensitive data unsynced to other facilities when a facility changes from sensitive to non-sensitive, until the data is edited', async () => {
      // Create a facility that starts as sensitive
      const facility = await models.Facility.create(fake(models.Facility, { isSensitive: true }));
      const department = await models.Department.create(
        fake(models.Department, { facilityId: facility.id }),
      );
      const location = await models.Location.create(
        fake(models.Location, { facilityId: facility.id }),
      );

      // Create encounter while facility is sensitive
      const encounter = await models.Encounter.create({
        ...fake(models.Encounter),
        patientId: patient.id,
        locationId: location.id,
        departmentId: department.id,
        examinerId: practitioner.id,
        endDate: null,
      });

      // Initialize sync manager and update lookup table to capture the sensitive state
      const centralSyncManager = initializeCentralSyncManager(lookupEnabledConfig);
      await centralSyncManager.updateLookupTable();

      // Change facility to non-sensitive and update lookup table
      await facility.update({ isSensitive: false });
      await centralSyncManager.updateLookupTable();

      // Check that the historical sensitive data is still unsynced to the non-sensitive facility
      const beforeEditEncounterIds = await getOutgoingIdsForRecordType(
        centralSyncManager,
        nonSensitiveFacility.id,
        'encounters',
      );
      expect(beforeEditEncounterIds).not.toContain(encounter.id);

      // Edit the encounter to trigger a new sync
      await encounter.update({ reasonForEncounter: 'Updated reason for encounter' });
      await centralSyncManager.updateLookupTable();

      // Check that the new encounter changes are synced to the non-sensitive facility
      const updatedEncounterIds = await getOutgoingIdsForRecordType(
        centralSyncManager,
        nonSensitiveFacility.id,
        'encounters',
      );
      expect(updatedEncounterIds).toContain(encounter.id);
    });

    it('will keep historical non-sensitive data synced to other facilities when a facility changes to sensitive, but stop syncing new changes', async () => {
      // Create a facility that starts as non-sensitive
      const facility = await models.Facility.create(fake(models.Facility, { isSensitive: false }));
      const department = await models.Department.create(
        fake(models.Department, { facilityId: facility.id }),
      );
      const location = await models.Location.create(
        fake(models.Location, { facilityId: facility.id }),
      );

      // Create encounter while facility is non-sensitive
      const encounter = await models.Encounter.create({
        ...fake(models.Encounter),
        patientId: patient.id,
        locationId: location.id,
        departmentId: department.id,
        examinerId: practitioner.id,
        endDate: null,
      });

      // Initialize sync manager and update lookup table to capture the non-sensitive state
      const centralSyncManager = initializeCentralSyncManager(lookupEnabledConfig);
      await centralSyncManager.updateLookupTable();

      // Change facility to sensitive and update lookup table
      await facility.update({ isSensitive: true });
      await centralSyncManager.updateLookupTable();

      // Check that the historical non-sensitive data is still synced to the non-sensitive facility
      const beforeEditEncounterIds = await getOutgoingIdsForRecordType(
        centralSyncManager,
        nonSensitiveFacility.id,
        'encounters',
      );
      expect(beforeEditEncounterIds).toContain(encounter.id);

      // Edit the encounter to trigger a new sync
      await encounter.update({ reasonForEncounter: 'Updated reason for encounter' });
      await centralSyncManager.updateLookupTable();

      // Check that the new encounter changes are not synced to the non-sensitive facility
      const updatedEncounterIds = await getOutgoingIdsForRecordType(
        centralSyncManager,
        nonSensitiveFacility.id,
        'encounters',
      );
      expect(updatedEncounterIds).not.toContain(encounter.id);
    });

    it('will not sync prescriptions linked through patient_ongoing_prescriptions from a sensitive facility', async () => {
      const testPatient = await models.Patient.create(fake(models.Patient));

      // Patient linked to both facilities
      await models.PatientFacility.create({
        id: models.PatientFacility.generateId(),
        patientId: testPatient.id,
        facilityId: sensitiveFacility.id,
      });
      await models.PatientFacility.create({
        id: models.PatientFacility.generateId(),
        patientId: testPatient.id,
        facilityId: nonSensitiveFacility.id,
      });

      const sensitiveEncounter = await models.Encounter.create(
        fake(models.Encounter, {
          patientId: testPatient.id,
          locationId: (
            await models.Location.create(
              fake(models.Location, {
                facilityId: sensitiveFacility.id,
              }),
            )
          ).id,
          departmentId: (
            await models.Department.create(
              fake(models.Department, {
                facilityId: sensitiveFacility.id,
              }),
            )
          ).id,
          examinerId: practitioner.id,
          endDate: null,
        }),
      );

      // Create prescriptions that are only linked through patient_ongoing_prescriptions (no encounters)
      const sensitivePrescription = await models.Prescription.create(fake(models.Prescription));
      const nonSensitivePrescription = await models.Prescription.create(fake(models.Prescription));

      const sensitiveEncounterPrescription = await models.EncounterPrescription.create(
        fake(models.EncounterPrescription, {
          encounterId: sensitiveEncounter.id,
          prescriptionId: sensitivePrescription.id,
        }),
      );

      const nonSensitiveEncounterPrescription = await models.EncounterPrescription.create(
        fake(models.EncounterPrescription, {
          encounterId: nonSensitiveEncounter.id,
          prescriptionId: nonSensitivePrescription.id,
        }),
      );

      const sensitivePatientOngoingPrescription = await models.PatientOngoingPrescription.create(
        fake(models.PatientOngoingPrescription, {
          patientId: testPatient.id,
          prescriptionId: sensitivePrescription.id,
        }),
      );

      const nonSensitivePatientOngoingPrescription = await models.PatientOngoingPrescription.create(
        fake(models.PatientOngoingPrescription, {
          patientId: testPatient.id,
          prescriptionId: nonSensitivePrescription.id,
        }),
      );

      const centralSyncManager = initializeCentralSyncManager(lookupEnabledConfig);
      await centralSyncManager.updateLookupTable();

      // Check that both prescriptions are in the lookup table
      const prescriptionIds = await getOutgoingIdsForRecordType(
        centralSyncManager,
        nonSensitiveFacility.id,
        models.Prescription.tableName,
      );

      const encounterPrescriptionIds = await getOutgoingIdsForRecordType(
        centralSyncManager,
        nonSensitiveFacility.id,
        models.EncounterPrescription.tableName,
      );

      const patientOngoingPrescriptionIds = await getOutgoingIdsForRecordType(
        centralSyncManager,
        nonSensitiveFacility.id,
        models.PatientOngoingPrescription.tableName,
      );

      expect(prescriptionIds).not.toContain(sensitivePrescription.id);
      expect(prescriptionIds).toContain(nonSensitivePrescription.id);
      expect(encounterPrescriptionIds).not.toContain(sensitiveEncounterPrescription.id);
      expect(encounterPrescriptionIds).toContain(nonSensitiveEncounterPrescription.id);
      expect(patientOngoingPrescriptionIds).not.toContain(sensitivePatientOngoingPrescription.id);
      expect(patientOngoingPrescriptionIds).toContain(nonSensitivePatientOngoingPrescription.id);
    });
  });
});
