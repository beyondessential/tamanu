import { add, subDays, startOfDay } from 'date-fns';

import { fake, fakeUser, fakeReferenceData } from '@tamanu/shared/test-helpers/fake';
import { fakeUUID } from '@tamanu/shared/utils/generateId';

import { getCurrentDateString, toDateTimeString } from '@tamanu/shared/utils/dateTime';
import { createTestContext } from '../utilities';

async function prepopulate(models) {
  const patientId = fakeUUID();
  const encounterId = fakeUUID();

  const {
    AdministeredVaccine,
    Encounter,
    Department,
    LabRequest,
    Location,
    Facility,
    Patient,
    ReferenceData,
    ScheduledVaccine,
    User,
    Vitals,
  } = models;

  const examiner = await User.create(fakeUser());
  await Patient.create({ ...fake(Patient), id: patientId });
  const fact = await Facility.create({ ...fake(Facility) });
  const dept = await Department.create({ ...fake(Department), facilityId: fact.id });
  const loc = await Location.create({ ...fake(Location), facilityId: fact.id });

  await ReferenceData.create({
    ...fakeReferenceData(),
    id: 'drug-Placebo',
    code: 'Placebo',
    type: 'drug',
    name: 'Placebo',
  });

  await ReferenceData.create({
    ...fakeReferenceData(),
    id: 'drug-COVAX',
    code: 'COVAX',
    type: 'drug',
    name: 'COVAX',
  });

  await ReferenceData.create({
    ...fakeReferenceData(),
    id: 'drug-COVID-19-Astra-Zeneca',
    code: 'COVID-19-AZ',
    type: 'drug',
    name: 'COVID-19 AZ',
  });

  await Encounter.create({
    ...fake(Encounter),
    id: encounterId,
    patientId,
    encounterType: 'clinic',
    examinerId: examiner.id,
    departmentId: dept.id,
    locationId: loc.id,
  });

  await Vitals.create({ ...fake(Vitals), encounterId });
  await Vitals.create({ ...fake(Vitals), encounterId });

  const covidCategory = await ReferenceData.create({
    type: 'labTestCategory',
    name: 'COVID',
    code: 'testLabTestCategory',
  });

  const category = await ReferenceData.create({
    type: 'labTestCategory',
    name: 'Random',
    code: 'testLabTestCategory',
  });

  const method = await models.ReferenceData.create({
    type: 'labTestMethod',
    name: 'Random',
    code: 'testLabTestMethod',
  });

  const labRequest1 = await LabRequest.create({
    ...fake(LabRequest),
    encounterId,
    labTestCategoryId: covidCategory.id,
    status: 'published',
    sampleTime: toDateTimeString(subDays(startOfDay(new Date()), 15)),
  });

  const labRequest2 = await LabRequest.create({
    ...fake(LabRequest),
    encounterId,
    labTestCategoryId: covidCategory.id,
    status: 'published',
    sampleTime: toDateTimeString(subDays(startOfDay(new Date()), 15)),
  });

  const labRequest3 = await LabRequest.create({
    ...fake(LabRequest),
    encounterId,
    labTestCategoryId: category.id,
    status: 'published',
    sampleTime: toDateTimeString(subDays(startOfDay(new Date()), 15)),
  });

  const labTestType = await models.LabTestType.create({
    labTestCategoryId: category.id,
    name: 'LabTest111',
    code: 'LabTest111',
  });

  await models.LabTest.create({
    result: 'Positive',
    labTestTypeId: labTestType.id,
    labRequestId: labRequest1.id,
    labTestMethodId: method.id,
    completedDate: getCurrentDateString(),
  });

  await models.LabTest.create({
    result: 'Positive',
    labTestTypeId: labTestType.id,
    labRequestId: labRequest2.id,
    labTestMethodId: method.id,
    completedDate: getCurrentDateString(),
  });

  await models.LabTest.create({
    result: 'Positive',
    labTestTypeId: labTestType.id,
    labRequestId: labRequest3.id,
    labTestMethodId: method.id,
    completedDate: getCurrentDateString(),
  });

  const scheduledVaccineId = fakeUUID();

  await ScheduledVaccine.create({
    ...fake(ScheduledVaccine),
    id: scheduledVaccineId,
    vaccineId: 'drug-Placebo',
  });

  const now = new Date();

  await AdministeredVaccine.create({
    ...fake(AdministeredVaccine),
    id: 'first',
    status: 'GIVEN',
    date: add(now, { minutes: 1 }),
    scheduledVaccineId,
    encounterId,
  });

  await AdministeredVaccine.create({
    ...fake(AdministeredVaccine),
    id: 'last',
    status: 'GIVEN',
    date: add(now, { minutes: 2 }),
    scheduledVaccineId,
    encounterId,
  });

  return { patientId, encounterId };
}

describe('Patient', () => {
  let ctx;
  let models;
  let testIds;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    testIds = await prepopulate(models);
  });
  afterAll(() => ctx.close());

  describe('Patient.getLabRequests', () => {
    it('should return the correct amount of lab requests', async () => {
      // Arrange
      const { Patient } = models;
      const { patientId } = testIds;
      // Act
      const patient = await Patient.findByPk(patientId);
      const results = await patient.getCovidLabTests();
      // Assert
      expect(results.length).toEqual(2);
    });
  });

  describe('Patient.getAdministeredVaccines', () => {
    it('should return the correct amount of administered vaccines', async () => {
      // Arrange
      const { Patient } = models;
      const { patientId } = testIds;
      // Act
      const patient = await Patient.findByPk(patientId);
      const { count } = await patient.getAdministeredVaccines();
      // Assert
      expect(count).toEqual(2);
    });

    it('should return the most recent vaccines first', async () => {
      // Arrange
      const { Patient } = models;
      const { patientId } = testIds;
      // Act
      const patient = await Patient.findByPk(patientId);
      const { data } = await patient.getAdministeredVaccines();
      const firstResult = data[0];

      // Assert
      expect(firstResult.id).toEqual('last');
    });

    it('should return the correct format', async () => {
      // Arrange
      const { Patient } = models;
      const { patientId, encounterId } = testIds;
      // Act
      const patient = await Patient.findByPk(patientId);
      const { data } = await patient.getAdministeredVaccines();
      const firstResult = data[0];
      // Assert
      expect(firstResult).toHaveProperty('status', 'GIVEN');
      expect(firstResult).toHaveProperty('encounter.id', encounterId);
    });
  });
});
