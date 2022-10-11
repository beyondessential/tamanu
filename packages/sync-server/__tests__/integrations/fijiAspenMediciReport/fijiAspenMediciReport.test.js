import config from 'config';
import { utcToZonedTime, zonedTimeToUtc, formatInTimeZone } from 'date-fns-tz';
import {
  REFERENCE_TYPES,
  NOTE_RECORD_TYPES,
  NOTE_TYPES,
  ENCOUNTER_TYPES,
  IMAGING_TYPES,
  DIAGNOSIS_CERTAINTY,
} from 'shared/constants';
import { toDateTimeString } from 'shared/utils/dateTime';
import { fake } from 'shared/test-helpers/fake';
import { createTestContext } from 'sync-server/__tests__/utilities';
import { milliseconds } from 'date-fns';

const COUNTRY_TIMEZONE = config?.countryTimeZone;

const createTime = (year, month, day, hour, minute, second, millisecond) => {
  // This is wrong, because we want to interpret the input as UTC
  const unzonedTimeImplicitlyLocal = new Date(year, month, day, hour, minute, second);
  console.log('unzonedTimeImplicitlyLocal', unzonedTimeImplicitlyLocal);
  const fijiTime2 = toDateTimeString(unzonedTimeImplicitlyLocal);
  console.log('fijiTime2', fijiTime2);
  const unzonedTimeOfUtcDateAssumingTheUnzonedTimeWasFJT = zonedTimeToUtc(unzonedTimeImplicitlyLocal, 'FJT');
  console.log('unzonedTimeOfUtcDateAssumingTheUnzonedTimeWasFJT', unzonedTimeOfUtcDateAssumingTheUnzonedTimeWasFJT);
  // const fijiTime1 = toDateTimeString(unzonedTimeOfUtcDateAssumingTheUnzonedTimeWasFJT);
  // console.log('fijiTime1', fijiTime1);

}
createTime(2022, 5, 15, 4, 12, 16, 258);

const fakeAllData = async models => {
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
  const { id: procedureTypeId } = await models.ReferenceData.create(
    fake(models.ReferenceData, {
      type: REFERENCE_TYPES.PATIENT_BILLING_TYPE,
      code: '61340',
      name: 'Subtemporal cranial decompression (pseudotumor cerebri, slit ventricle syndrome)',
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
  const { id: leftImagingAreaId } = await models.ReferenceData.create(
    fake(models.ReferenceData, {
      type: REFERENCE_TYPES.X_RAY_IMAGING_AREA,
      name: 'Left Leg',
      code: 'LL',
    }),
  );
  const { id: rightImagingAreaId } = await models.ReferenceData.create(
    fake(models.ReferenceData, {
      type: REFERENCE_TYPES.X_RAY_IMAGING_AREA,
      name: 'Right Leg',
      code: 'RL',
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
  // console.log(formatInTimeZone(utcToZonedTime('2022-06-09T00:02:54.225', COUNTRY_TIMEZONE), 'UTC'));
  // console.log(utcToZonedTime('2022-06-09T00:02:54.225', COUNTRY_TIMEZONE).toISOString());
  // console.log(utcToZonedTime('2022-06-09T00:02:54.225', COUNTRY_TIMEZONE));
  // console.log(toDateTimeString('2022-06-09T00:02:54.225'));
  const { id: encounterId } = await models.Encounter.create(
    fake(models.Encounter, {
      patientId: patient.id,
      startDate: toDateTimeString(new Date(2022, 6-1, 9, 0, 2, 54, 225)),
      endDate: '2022-06-12T00:02:54.225', // Make sure this works
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
  await models.Procedure.create(
    fake(models.Procedure, {
      encounterId,
      procedureTypeId,
      locationId: location1Id,
      date: '2022-06-11T01:20:54.225+00:00',
      note: 'All ready for procedure here',
      completedNote: 'Everything went smoothly, no issues',
    }),
  );
  const { id: imagingRequestId } = await models.ImagingRequest.create(
    fake(models.ImagingRequest, {
      encounterId,
      procedureTypeId,
      requestedById: userId,
      imagingType: IMAGING_TYPES.X_RAY,
      requestedDate: '2022-06-11T01:20:54.225+00:00',
    }),
  );
  await models.ImagingRequestAreas.create(
    fake(models.ImagingRequestAreas, {
      imagingRequestId,
      areaId: leftImagingAreaId,
    }),
  );
  await models.ImagingRequestAreas.create(
    fake(models.ImagingRequestAreas, {
      imagingRequestId,
      areaId: rightImagingAreaId,
    }),
  );
  const { id: imagingNotePageId } = await models.NotePage.create(
    fake(models.NotePage, {
      recordId: imagingRequestId,
      noteType: NOTE_TYPES.OTHER,
      recordType: NOTE_RECORD_TYPES.IMAGING_REQUEST,
    }),
  );
  await models.NoteItem.create(
    fake(models.NoteItem, {
      notePageId: imagingNotePageId,
      content: 'Check for fractured knees please',
      date: '2022-06-10T06:04:54.225Z',
    }),
  );

  const { id: labRequestId } = await models.LabRequest.create(
    fake(models.LabRequest, { encounterId }),
  );
  await models.LabTest.create(fake(models.LabTest, { labRequestId, labTestTypeId }));
  const { id: labsNotePageId } = await models.NotePage.create(
    fake(models.NotePage, {
      recordId: labRequestId,
      noteType: NOTE_TYPES.OTHER,
      recordType: NOTE_RECORD_TYPES.LAB_REQUEST,
    }),
  );
  await models.NoteItem.create(
    fake(models.NoteItem, {
      notePageId: labsNotePageId,
      content: 'Please perform this lab test very carefully',
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

  const { id: encounterNotePageId } = await models.NotePage.create(
    fake(models.NotePage, {
      recordId: encounterId,
      noteType: NOTE_TYPES.NURSING,
      recordType: NOTE_RECORD_TYPES.ENCOUNTER,
    }),
  );
  await models.NoteItem.create(
    fake(models.NoteItem, {
      notePageId: encounterNotePageId,
      content: 'A\nB\nC\nD\nE\nF\nG\n',
      date: '2022-06-10T03:39:57.617+00:00',
    }),
  );
  await models.NoteItem.create(
    fake(models.NoteItem, {
      notePageId: encounterNotePageId,
      content: 'H\nI\nJ\nK\nL... nopqrstuv',
      date: '2022-06-10T04:39:57.617+00:00',
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

  return { patient, encounterId };
};

describe('fijiAspenMediciReport', () => {
  let ctx;
  let app;
  let models;

  // Reset everything between each test. Might be innefficient but there's only 2 tests
  beforeEach(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    app = await ctx.baseApp.asRole('practitioner');
  });

  afterEach(() => ctx.close());

  it(`Should filter by date`, async () => {
    const { patient, encounterId } = await fakeAllData(models);
    const response = await app
      .get('/v1/integration/fijiAspenMediciReport?period.start=1921-05-09&period.end=1922-05-09')
      .set({ 'X-Tamanu-Client': 'medici', 'X-Version': '0.0.1' });

    expect(response).toHaveSucceeded();
    expect(response.body.data).toEqual([]);
  });

  it(`Should produce a simple report`, async () => {
    const { patient, encounterId } = await fakeAllData(models);

    // act
    const response = await app
      .get('/v1/integration/fijiAspenMediciReport?period.start=2022-05-09&period.end=2022-10-09')
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
        visitType: 'Hospital admission',
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
            name:
              'Subtemporal cranial decompression (pseudotumor cerebri, slit ventricle syndrome)',
            code: '61340',
            date: '2022-06-11T01:20:54.225+00:00',
            location: 'Emergency room 1',
            notes: 'All ready for procedure here',
            completedNotes: 'Everything went smoothly, no issues',
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
                content: 'Please perform this lab test very carefully',
                noteDate: '2022-06-09T02:04:54.225+00:00',
              },
            ],
          },
        ],
        imagingRequests: [
          {
            name: 'xRay',
            areasToBeImaged: ['Left Leg', 'Right Leg'],
            notes: [
              {
                noteType: 'other',
                content: 'Check for fractured knees please',
                noteDate: '2022-06-10T06:04:54.225+00:00',
              },
            ],
          },
        ],
        notes: [
          {
            noteType: NOTE_TYPES.NURSING,
            content: 'H\nI\nJ\nK\nL... nopqrstuv',
            noteDate: '2022-06-10T04:39:57.617+00:00',
          },
          {
            noteType: NOTE_TYPES.NURSING,
            content: 'A\nB\nC\nD\nE\nF\nG\n',
            noteDate: '2022-06-10T03:39:57.617+00:00',
          },
        ],
      },
    ]);
  });
});
