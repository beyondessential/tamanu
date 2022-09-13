import { subDays } from 'date-fns';

import {
  REFERENCE_TYPES,
  NOTE_RECORD_TYPES,
  NOTE_TYPES,
  ENCOUNTER_TYPES,
  DIAGNOSIS_CERTAINTY,
} from 'shared/constants';
import { fake } from 'shared/test-helpers/fake';
import { createTestContext } from 'sync-server/__tests__/utilities';

describe('fijiAspenMediciReport', () => {
  let ctx;
  let app;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    app = await ctx.baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  describe('success', () => {
    it(`Should produce a simple report`, async () => {
      // arrange
      // Data already in the system
      const { id: userId } = await models.User.create(fake(models.User));
      const { id: facilityId } = await models.Facility.create(fake(models.Facility));
      const { id: departmentId } = await models.Department.create(
        fake(models.Department, { facilityId, name: 'Emergency dept.' }),
      );
      const { id: location1Id } = await models.Location.create(
        fake(models.Location, { facilityId, name: 'Emergency room 1' }),
      );
      const { id: location2Id } = await models.Location.create(
        fake(models.Location, { facilityId, name: 'Emergency room 2' }),
      );
      const { id: patientBillingTypeId } = await models.ReferenceData.create(
        fake(models.ReferenceData, {
          type: REFERENCE_TYPES.PATIENT_BILLING_TYPE,
          name: 'Public',
        }),
      );
      const { id: medication5Id } = await models.ReferenceData.create(
        fake(models.ReferenceData, { type: REFERENCE_TYPES.DRUG, name: 'Glucose (hypertonic) 5%' }),
      );
      const { id: medication10Id } = await models.ReferenceData.create(
        fake(models.ReferenceData, {
          type: REFERENCE_TYPES.DRUG,
          name: 'Glucose (hypertonic) 10%',
        }),
      );
      const { id: vaccineDrugId } = await models.ReferenceData.create(
        fake(models.ReferenceData, {
          type: REFERENCE_TYPES.DRUG,
          name: 'Covid AZ',
        }),
      );
      const { id: scheduledVaccineId } = await models.ScheduledVaccine.create(
        fake(models.ScheduledVaccine, {
          type: REFERENCE_TYPES.VACCINE,
          label: 'Covid Schedule Label',
          schedule: 'Dose 1',
          vaccineId: vaccineDrugId,
        }),
      );
      const { id: diagnosisId } = await models.ReferenceData.create(
        fake(models.ReferenceData, {
          type: REFERENCE_TYPES.ICD10,
          name: 'Acute subdural hematoma',
          code: 'S06.5',
        }),
      );
      const { id: labTestCategoryId } = await models.ReferenceData.create(
        fake(models.ReferenceData, { type: REFERENCE_TYPES.LAB_TEST_CATEGORY }),
      );
      const { id: dischargeDispositionId } = await models.ReferenceData.create(
        fake(models.ReferenceData, {
          type: REFERENCE_TYPES.DISCHARGE_DISPOSITION,
          code: 'TRANSFER',
          name: 'Transfer to another facility',
        }),
      );
      const { id: labTestTypeId } = await models.LabTestType.create(
        fake(models.LabTestType, {
          labTestCategoryId,
          name: 'Bicarbonate',
        }),
      );

      // Data related to the encounter
      const patient = await models.Patient.create(
        fake(models.Patient, {
          displayId: 'BTIO864386',
          dateOfBirth: '1952-10-12',
        }),
      );
      const { id: encounterId } = await models.Encounter.create(
        fake(models.Encounter, {
          patientId: patient.id,
          startDate: '2022-06-09T00:02:54.225Z',
          endDate: '2022-06-12T00:02:54.225+00:00', // Make sure this works
          encounterType: ENCOUNTER_TYPES.ADMISSION,
          reasonForEncounter: 'Severe Migrane',
          patientBillingTypeId,
          locationId: location1Id,
          departmentId,
        }),
      );
      // Call build and save to avoid custom triage.create logic
      const triage = models.Triage.build(
        fake(models.Triage, {
          encounterId,
          score: 2,
          triageTime: '2022-06-09T02:04:54.225Z',
          closedTime: '2022-06-09T03:07:54.225Z',
        }),
        {
          options: { raw: true },
        },
      );
      await triage.save();

      // Data referenced by the encounter
      await models.PatientBirthData.create(
        fake(models.PatientBirthData, { patientId: patient.id, birthWeight: 2100 }),
      );
      await models.EncounterDiagnosis.create(
        // Yes - diagnosed with the same thing twice
        fake(models.EncounterDiagnosis, {
          encounterId,
          diagnosisId,
          isPrimary: false,
          certainty: DIAGNOSIS_CERTAINTY.SUSPECTED,
          date: '2022-06-09T11:09:54.225+00:00',
        }),
      );
      await models.EncounterDiagnosis.create(
        fake(models.EncounterDiagnosis, {
          encounterId,
          diagnosisId,
          isPrimary: true,
          certainty: DIAGNOSIS_CERTAINTY.CONFIRMED,
          date: '2022-06-09T11:10:54.225+00:00',
        }),
      );
      await models.EncounterMedication.create(
        fake(models.EncounterMedication, {
          encounterId,
          medicationId: medication5Id,
          discontinued: true,
          date: '2022-06-10T01:10:54.225+00:00',
          discontinuedDate: '2022-06-10T01:19:54.225+00:00',
          discontinuingReason: 'It was not enough',
        }),
      );
      await models.EncounterMedication.create(
        fake(models.EncounterMedication, {
          encounterId,
          medicationId: medication10Id,
          discontinued: null,
          date: '2022-06-10T01:20:54.225+00:00',
          discontinuedDate: null,
          discontinuingReason: null,
        }),
      );
      await models.AdministeredVaccine.create(
        fake(models.AdministeredVaccine, { encounterId, scheduledVaccineId }),
      );
      await models.Procedure.create(fake(models.Procedure, { encounterId }));

      const { id: labRequestId } = await models.LabRequest.create(
        fake(models.LabRequest, { encounterId }),
      );
      await models.LabTest.create(fake(models.LabTest, { labRequestId, labTestTypeId }));
      const { id: notePageId } = await models.NotePage.create(
        fake(models.NotePage, {
          recordId: labRequestId,
          noteType: NOTE_TYPES.OTHER,
          recordType: NOTE_RECORD_TYPES.LAB_REQUEST,
        }),
      );
      await models.NoteItem.create(
        fake(models.NoteItem, {
          notePageId,
          content: 'This is a lab request note',
          date: '2022-06-09T02:04:54.225Z',
        }),
      );
      await models.Discharge.create(
        fake(models.Discharge, {
          encounterId,
          dischargerId: userId,
          dispositionId: dischargeDispositionId,
        }),
      );

      // Location/departments:
      const encounter = await models.Encounter.findByPk(encounterId);
      await encounter.update({
        locationId: location2Id,
      });

      const { id: resultantNotePageId } = await models.NotePage.findOne({
        where: {
          noteType: NOTE_TYPES.SYSTEM,
        },
      });
      const systemNoteItem = await models.NoteItem.findOne({
        where: {
          notePageId: resultantNotePageId,
        },
      });
      systemNoteItem.date = '2022-06-09T08:04:54.225Z';
      await systemNoteItem.save();

      // act
      const response = await app
        .get(
          `/v1/integration/fijiAspenMediciReport?'period.start'=${subDays(
            new Date(),
            30,
          ).toISOString()}&'period.end'=${new Date().toISOString()}`,
        )
        .set({ 'X-Tamanu-Client': 'medici', 'X-Version': '0.0.1' });

      // assert
      expect(response).toHaveSucceeded();
      expect(response.body.data).toEqual([
        {
          // Patient Details
          patientId: 'BTIO864386',
          firstname: patient.firstName,
          lastname: patient.lastName,
          dateOfBirth: '1952-10-12',
          age: expect.any(Number), // TODO
          sex: patient.sex,

          // Encounter Details
          encounterId,
          patientBillingType: 'Public',
          encounterStartDate: '2022-06-09T00:02:54.225Z',
          encounterEndDate: '2022-06-12T00:02:54.225Z',
          encounterType: 'AR-DRG',
          reasonForEncounter: 'Severe Migrane',

          // New fields
          weight: 2100,
          hoursOfVentilation: 0, // Placeholder - always 0
          leaveDays: 0, // Placeholder - always 0
          visitType: expect.any(String),
          episodeEndStatus: {
            code: 'TRANSFER',
            name: 'Transfer to another facility',
          },
          encounterDischargeDisposition: {
            code: 'TRANSFER',
            name: 'Transfer to another facility',
          },

          // Triage Details
          triageCategory: 'Priority',
          waitTime: '1:3', // h:m

          // Location/Department
          locations: [
            {
              location: 'Emergency room 1',
              assignedTime: '2022-06-09T00:02:54.225+00:00',
            },
            {
              location: 'Emergency room 2',
              assignedTime: '2022-06-09T08:04:54.225+00:00',
            },
          ],
          departments: [
            {
              department: 'Emergency dept.',
              assignedTime: '2022-06-09T00:02:54.225+00:00',
            },
          ],

          // Encounter Relations
          diagnoses: [
            {
              name: 'Acute subdural hematoma',
              code: 'S06.5',
              isPrimary: true,
              certainty: DIAGNOSIS_CERTAINTY.CONFIRMED,
            },
            {
              name: 'Acute subdural hematoma',
              code: 'S06.5',
              isPrimary: false,
              certainty: DIAGNOSIS_CERTAINTY.SUSPECTED,
            },
          ],
          medications: [
            {
              name: 'Glucose (hypertonic) 10%',
              discontinued: false,
              discontinuedDate: null,
              discontinuingReason: null,
            },
            {
              name: 'Glucose (hypertonic) 5%',
              discontinued: true,
              discontinuedDate: '2022-06-10T01:19:54.225+00:00',
              discontinuingReason: 'It was not enough',
            },
          ],
          vaccinations: [
            {
              label: 'Covid Schedule Label',
              name: 'Covid AZ',
              schedule: 'Dose 1',
            },
          ],
          procedures: [
            {
              name: null, // expect.any(String),
              // 'Subtemporal cranial decompression (pseudotumor cerebri, slit ventricle syndrome)',
              code: null, // expect.any(String), // '61340',
              date: expect.any(String), // '2022-10-06',
              location: null, // expect.any(String), //'Ba Mission Sub-divisional Hospital General Clinic',
              notes: expect.any(String), // null,
              completedNotes: expect.any(String), // null,
            },
          ],
          labRequests: [
            {
              tests: [
                {
                  name: 'Bicarbonate',
                },
              ],
              notes: [
                {
                  noteType: NOTE_TYPES.OTHER,
                  content: 'This is a lab request note',
                  noteDate: '2022-06-09T02:04:54.225+00:00',
                },
              ],
            },
          ],
          imagingRequests: null,
          // [
          //   {
          //     name: 'CT Scan',
          //     areaToBeImaged: null,
          //     notes: [
          //       {
          //         noteType: 'other',
          //         content: 'image request note',
          //         noteDate: '2022-06-09T02:02:31.648+00:00',
          //       },
          //       {
          //         noteType: 'areaToBeImaged',
          //         content: 'pelvis',
          //         noteDate: '2022-06-09T02:02:31.712+00:00',
          //       },
          //     ],
          //   },
          // ],
          notes: null,
          //  [
          //   {
          //     noteType: 'nursing',
          //     content: 'A\nB\nC\nD\nE\nF\nG\n',
          //     noteDate: '2022-06-10T03:39:57.617+00:00',
          //   },
          // ],
        },
      ]);
    });
  });
});
