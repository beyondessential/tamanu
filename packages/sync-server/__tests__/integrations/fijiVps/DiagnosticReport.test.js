import { fake } from 'shared/test-helpers/fake';
import { createTestContext } from 'sync-server/__tests__/utilities';

describe('VPS integration - DiagnosticReport', () => {
  let ctx;
  let app;
  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  describe('success', () => {
    it('fetches a diagnostic report', async () => {
      // arrange
      const {
        LabTest,
        LabRequest,
        ReferenceData,
        LabTestType,
        Encounter,
        Patient,
        User,
      } = ctx.store.models;

      const patient = await Patient.create(fake(Patient));
      const examiner = await User.create(fake(User));
      const encounter = await Encounter.create({
        ...fake(Encounter),
        patientId: patient.id,
        examinerId: examiner.id,
      });
      const laboratory = await ReferenceData.create({
        ...fake(ReferenceData),
        type: 'labTestLaboratory',
      });
      const labTestCategory = await ReferenceData.create({
        ...fake(ReferenceData),
        type: 'labTestCategory',
      });
      const labRequest = await LabRequest.create({
        ...fake(LabRequest),
        encounterId: encounter.id,
        laboratoryId: laboratory.id,
        categoryId: labTestCategory.id,
      });
      const labTestType = await LabTestType.create({
        ...fake(LabTestType),
        labTestCategoryId: labTestCategory.id,
      });
      const labTestMethod = await ReferenceData.create({
        ...fake(ReferenceData),
        type: 'labTestMethod',
      });
      const labTest = await LabTest.create({
        ...fake(LabTest),
        labTestTypeId: labTestType.id,
        labRequestId: labRequest.id,
        labTestMethodId: labTestMethod.id,
        categoryId: labTestCategory.id,
      });

      const id = encodeURIComponent(patient.displayId);
      const path = `/v1/integration/fijiVps/DiagnosticReport?_sort=-issued&_page=0&_count=2&status=final&subject%3Aidentifier=VRS%7C${id}`;

      // act
      const response = await app.get(path);

      // assert
      expect(response).toHaveSucceeded();
      expect(response.body).toEqual({
        resourceType: 'Bundle',
        id: 'diagnostic-reports',
        meta: {
          lastUpdated: labTest.updatedAt.toISOString(),
        },
        type: 'searchset',
        total: 1,
        link: [
          {
            relation: 'self',
            link: expect.stringContaining(path),
          },
        ],
        entry: [
          {
            active: true,
            identifier: [
              {
                use: 'usual',
                value: labTest.id,
              },
              {
                assigner: 'Tamanu',
                system: 'http://tamanu.io/data-dictionary/application-reference-number.html',
                use: 'official',
                value: labRequest.displayId,
              },
            ],
            resourceType: 'DiagnosticReport',
          },
        ],
      });
    });
  });

  describe('failure', () => {
    it.todo('returns an error when passed the wrong query params');
  });
});
