import { subDays } from 'date-fns';

import { REFERENCE_TYPES } from 'shared/constants';
import { NOTE_RECORD_TYPES } from 'shared/models/Note';
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
      const { id: diagnosisId } = await models.ReferenceData.create(
        fake(models.ReferenceData, { type: REFERENCE_TYPES.ICD10 }),
      );
      const { id: medicationId } = await models.ReferenceData.create(
        fake(models.ReferenceData, { type: REFERENCE_TYPES.DRUG }),
      );
      const { id: labTestCategoryId } = await models.ReferenceData.create(
        fake(models.ReferenceData, { type: REFERENCE_TYPES.LAB_TEST_CATEGORY }),
      );
      const { id: labTestTypeId } = await models.LabTestType.create(
        fake(models.LabTestType, { labTestCategoryId }),
      );

      const { id: patientId } = await models.Patient.create(
        fake(models.Patient, {
          displayId: 'BTIO864386',
          dateOfBirth: '1952-10-12',
        }),
      );
      const { id: encounterId } = await models.Encounter.create(
        fake(models.Encounter, { patientId }),
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
      await models.Note.create(
        fake(models.Note, { recordId: labRequestId, recordType: NOTE_RECORD_TYPES.LAB_REQUEST }),
      );

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
      expect(response.body.data).toMatchObject([
        {
          // Patient Details
          patientId: 'BTIO864386',
          firstname: expect.any(String),
          lastname: expect.any(String),
          dateOfBirth: '1952-10-12',
          age: expect.any(Number),
          sex: expect.any(String), // TODO: one of x, y, z?

          // Encounter Details
          patientBillingType: null,
          encounterId,
          encounterStartDate: expect.any(String), // TODO
          encounterEndDate: expect.any(String), // TODO
          encounterType: expect.any(String), // TODO
          reasonForEncounter: expect.any(String), // 'Survey response for Generic Referral',

          // Triage Details
          triageCategory: null,
          waitTime: 'hi',

          // Location/Department
          location: [
            {
              location: null, // expect.any(String),
              assigned_time: expect.any(String),
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
                  name: expect.any(String), // 'Bicarbonate',
                  notes: expect.any(String), // 'TODO',
                },
              ],
              notes: [
                {
                  note_type: expect.any(String), //'other',
                  content: expect.any(String), //'Add lab request note',
                  note_date: expect.any(String), //'2022-06-09T02:04:54.225+00:00',
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
