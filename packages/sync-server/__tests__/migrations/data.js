import { fake } from '@tamanu/shared/test-helpers/fake';

export async function generateData(models) {
  const { Department, Encounter, EncounterHistory, Facility, Location, Patient, User } = models;
  const examiner = await User.create(fake(User));
  const patient = await Patient.create(fake(Patient));
  const facility = await Facility.create(fake(Facility));
  const department = await Department.create(
    fake(Department, {
      facilityId: facility.id,
    }),
  );
  const location = await Location.create(
    fake(Location, {
      facilityId: facility.id,
    }),
  );
  const encounter = await Encounter.create(
    fake(Encounter, {
      patientId: patient.id,
      departmentId: department.id,
      locationId: location.id,
      examinerId: examiner.id,
      startDate: '2023-12-21T04:59:51.851Z',
    }),
  );
  await EncounterHistory.create(
    fake(EncounterHistory, {
      examinerId: examiner.id,
      encounterId: encounter.id,
      departmentId: department.id,
      locationId: location.id,
    }),
  );
  // TODO: add more tables until the tests pass
}
