import { subDays } from 'date-fns';

import { REFERENCE_TYPES, NOTE_RECORD_TYPES, NOTE_TYPES, ENCOUNTER_TYPES } from 'shared/constants';
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
      const { id: location1Id } = await models.Location.create(fake(models.Location, { facilityId, name: 'Emergency room 1' }));
      const { id: location2Id } = await models.Location.create(fake(models.Location, { facilityId, name: 'Emergency room 2' }));
      const { id: diagnosisId } = await models.ReferenceData.create(
        fake(models.ReferenceData, { type: REFERENCE_TYPES.ICD10 }),
      );
      const { id: patientBillingTypeId } = await models.ReferenceData.create(
        fake(models.ReferenceData, {
          type: REFERENCE_TYPES.PATIENT_BILLING_TYPE,
          name: 'Public',
        }),
      );
      const { id: medicationId } = await models.ReferenceData.create(
        fake(models.ReferenceData, { type: REFERENCE_TYPES.DRUG }),
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
        fake(models.EncounterDiagnosis, { encounterId, diagnosisId }),
      );
      await models.EncounterMedication.create(
        fake(models.EncounterMedication, { encounterId, medicationId }),
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
      const { id: resultantNotePageId } = await models.NotePage.findOne({ where: {
        noteType: NOTE_TYPES.SYSTEM,
      }})
      const systemNoteItem = await models.NoteItem.findOne({ where: {
        notePageId: resultantNotePageId,
      }})
      systemNoteItem.date = '2022-06-09T08:04:54.225Z';
      await systemNoteItem.save();
      console.log(systemNoteItem)

      console.log(await models.NoteItem.findAll());
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
          waitTime: 'TODO',

          // Location/Department
          location: [
            {
              location: 'Emergency room 1',
              assigned_time: '2022-06-09T00:02:54.225+00:00',
            },
            {
              location: 'Emergency room 2',
              assigned_time: '2022-06-09T08:04:54.225+00:00',
            },
          ],
          department: [
            {
              department: null, // expect.any(String),
              assigned_time: expect.any(String),
            },
          ],

          // Encounter Relations
          diagnosis: [
            {
              name: expect.any(String), // 'Acute subdural hematoma',
              code: expect.any(String), // 'S06.5',
              is_primary: expect.any(String), // 'primary',
              certainty: expect.any(String), // 'confirmed',
            },
          ],
          medications: [
            {
              name: expect.any(String), // 'Glucose (hypertonic) 10%',
              discontinued: expect.any(Boolean),
              discontinued_date: expect.any(String), // ISO8601
              discontinuing_reason: expect.any(String), // 'No longer clinically indicated',
            },
          ],
          vaccinations: null,
          procedures: [
            {
              name: null, // expect.any(String),
              // 'Subtemporal cranial decompression (pseudotumor cerebri, slit ventricle syndrome)',
              code: null, // expect.any(String), // '61340',
              date: expect.any(String), // '2022-10-06',
              location: null, // expect.any(String), //'Ba Mission Sub-divisional Hospital General Clinic',
              notes: expect.any(String), // null,
              completed_notes: expect.any(String), // null,
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
                  note_type: NOTE_TYPES.OTHER,
                  content: 'This is a lab request note',
                  note_date: '2022-06-09T02:04:54.225+00:00',
                },
              ],
            },
          ],
          imagingRequests: null,
          // [
          //   {
          //     name: 'CT Scan',
          //     area_to_be_imaged: null,
          //     notes: [
          //       {
          //         note_type: 'other',
          //         content: 'image request note',
          //         note_date: '2022-06-09T02:02:31.648+00:00',
          //       },
          //       {
          //         note_type: 'areaToBeImaged',
          //         content: 'pelvis',
          //         note_date: '2022-06-09T02:02:31.712+00:00',
          //       },
          //     ],
          //   },
          // ],
          notes: null,
          //  [
          //   {
          //     note_type: 'nursing',
          //     content: 'A\nB\nC\nD\nE\nF\nG\n',
          //     note_date: '2022-06-10T03:39:57.617+00:00',
          //   },
          // ],
        },
      ]);
    });
  });
});
