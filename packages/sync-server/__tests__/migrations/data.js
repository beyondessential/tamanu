import { fake } from '@tamanu/shared/test-helpers/fake';
import { NOTE_RECORD_TYPES } from '@tamanu/constants';

export async function generateData(models) {
  const { Department, Encounter, EncounterHistory, Facility, Location,
    Patient, User, Note, PatientBirthData, SurveyScreenComponent, ReportDefinitionVersion } = models;
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
  await Note.create(
    fake(Note, {
      recordType: NOTE_RECORD_TYPES.ENCOUNTER,
      recordId: encounter.id,
      authorId: examiner.id
    })
  );
  await PatientBirthData.create(
    fake(PatientBirthData, {
      patientId: patient.id,
      facilityId: facility.id
    })
  );
  await SurveyScreenComponent.create(
    fake(SurveyScreenComponent)
  );
  await ReportDefinitionVersion.create(
    fake(ReportDefinitionVersion, {
      status: 'draft',
      queryOptions: `{"parameters": [], "defaultDateRange": "allTime"}`,
      userId: examiner.id
    })
  );
}
