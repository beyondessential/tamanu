import config from 'config';
import { upperFirst } from 'lodash';
import { utcToZonedTime } from 'date-fns-tz';
import {
  REFERENCE_TYPES,
  NOTE_RECORD_TYPES,
  NOTE_TYPES,
  ENCOUNTER_TYPES,
  IMAGING_TYPES,
  DIAGNOSIS_CERTAINTY,
} from '@tamanu/constants';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import { fake } from '@tamanu/fake-data/fake';
import { log } from '@tamanu/shared/services/logging';

import { createTestContext } from '../../utilities';
import { allFromUpstream } from '../../../dist/tasks/fhir/refresh/allFromUpstream';

const PRIMARY_TIME_ZONE = config?.primaryTimeZone;

const createLocalDateTimeFromUTC = (year, month, day, hour, minute, second, millisecond = 0) => {
  // Interprets inputs AS utc, and "utcTime" is the **local** version of that time
  // ie. 2022-02-03 2:30 -> 2022-02-03 4:30 (+02:00 (implied by local timezone))
  const utcTime = Date.UTC(year, month, day, hour, minute, second, millisecond);
  return utcToZonedTime(utcTime, PRIMARY_TIME_ZONE);
};

const createLocalDateTimeStringFromUTC = (
  year,
  month,
  day,
  hour,
  minute,
  second,
  millisecond = 0,
) => {
  const localTimeWithoutTimezone = toDateTimeString(
    createLocalDateTimeFromUTC(year, month, day, hour, minute, second, millisecond),
  );
  return localTimeWithoutTimezone;
};

const fakeAllData = async (models, ctx) => {
  const { id: userId } = await models.User.create(fake(models.User));
  const { id: examinerId } = await models.User.create(fake(models.User));
  const { id: facilityId } = await models.Facility.create(
    fake(models.Facility, { name: 'Ba Hospital' }),
  );
  const { id: departmentId } = await models.Department.create(
    fake(models.Department, { facilityId, name: 'Emergency dept.' }),
  );
  const { id: locationGroupId } = await models.LocationGroup.create(
    fake(models.LocationGroup, { facilityId, name: 'Emergency Department' }),
  );
  const { id: location1Id } = await models.Location.create(
    fake(models.Location, { facilityId, name: 'Emergency room 1', locationGroupId }),
  );
  const { id: location2Id } = await models.Location.create(
    fake(models.Location, { facilityId, name: 'Emergency room 2', locationGroupId }),
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
      doseLabel: 'Dose 1',
      vaccineId: vaccineDrugId,
    }),
  );
  const { id: diagnosisId } = await models.ReferenceData.create(
    fake(models.ReferenceData, {
      type: REFERENCE_TYPES.DIAGNOSIS,
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
  // open encounter
  const { id: openEncounterId } = await models.Encounter.create(
    fake(models.Encounter, {
      patientId: patient.id,
      startDate: createLocalDateTimeStringFromUTC(2022, 6 - 1, 15, 0, 2, 54, 225),
      encounterType: ENCOUNTER_TYPES.ADMISSION,
      reasonForEncounter: 'Severe Migrane',
      patientBillingTypeId,
      locationId: location1Id,
      departmentId,
      examinerId,
    }),
  );
  // closed encounter
  const { id: encounterId } = await models.Encounter.create(
    fake(models.Encounter, {
      patientId: patient.id,
      startDate: createLocalDateTimeStringFromUTC(2022, 6 - 1, 9, 0, 2, 54, 225),
      endDate: createLocalDateTimeStringFromUTC(2022, 6 - 1, 12, 0, 2, 54, 225), // Make sure this works
      encounterType: ENCOUNTER_TYPES.ADMISSION,
      reasonForEncounter: 'Severe Migrane',
      patientBillingTypeId,
      locationId: location1Id,
      departmentId,
      examinerId,
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
  const prescription = await models.Prescription.create(
    fake(models.Prescription, {
      medicationId: medication5Id,
      discontinued: true,
      date: '2022-06-10T01:10:54.225+00:00',
      discontinuedDate: '2022-06-10T01:19:54.225+00:00',
      discontinuingReason: 'It was not enough',
    }),
  );
  await models.EncounterPrescription.create(
    fake(models.EncounterPrescription, {
      encounterId,
      prescriptionId: prescription.id,
    }),
  );
  const prescription1 = await models.Prescription.create(
    fake(models.Prescription, {
      medicationId: medication10Id,
      discontinued: null,
      date: '2022-06-10T01:20:54.225+00:00',
      discontinuedDate: null,
      discontinuingReason: null,
    }),
  );
  await models.EncounterPrescription.create(
    fake(models.EncounterPrescription, {
      encounterId,
      prescriptionId: prescription1.id,
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
      date: createLocalDateTimeStringFromUTC(2022, 6 - 1, 11, 1, 20, 54),
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
  await models.ImagingRequestArea.create(
    fake(models.ImagingRequestArea, {
      imagingRequestId,
      areaId: leftImagingAreaId,
    }),
  );
  await models.ImagingRequestArea.create(
    fake(models.ImagingRequestArea, {
      imagingRequestId,
      areaId: rightImagingAreaId,
    }),
  );
  const imagingRequestNote = await models.Note.create(
    fake(models.Note, {
      recordId: imagingRequestId,
      noteTypeId: NOTE_TYPES.OTHER,
      recordType: NOTE_RECORD_TYPES.IMAGING_REQUEST,
      content: 'Check for fractured knees please',
      date: createLocalDateTimeStringFromUTC(2022, 6 - 1, 10, 6, 4, 54),
    }),
  );

  const { id: labRequestId } = await models.LabRequest.create(
    fake(models.LabRequest, { encounterId }),
  );
  await models.LabTest.create(fake(models.LabTest, { labRequestId, labTestTypeId }));
  const labRequestNote = await models.Note.create(
    fake(models.Note, {
      recordId: labRequestId,
      noteTypeId: NOTE_TYPES.OTHER,
      recordType: NOTE_RECORD_TYPES.LAB_REQUEST,
      content: 'Please perform this lab test very carefully',
      date: createLocalDateTimeStringFromUTC(2022, 6 - 1, 9, 2, 4, 54),
    }),
  );

  await models.Discharge.create(
    fake(models.Discharge, {
      encounterId,
      dischargerId: userId,
      dispositionId: dischargeDispositionId,
    }),
  );

  const encounterNote = await models.Note.create(
    fake(models.Note, {
      recordId: encounterId,
      noteTypeId: NOTE_TYPES.OTHER,
      recordType: NOTE_RECORD_TYPES.ENCOUNTER,
      content: 'A\nB\nC\nD\nE\nF\nG\n',
      date: createLocalDateTimeStringFromUTC(2022, 6 - 1, 10, 3, 39, 57),
    }),
  );

  // Location/departments:
  const encounter = await models.Encounter.findByPk(encounterId);
  await encounter.update({
    locationId: location2Id,
    submittedTime: createLocalDateTimeStringFromUTC(2022, 6 - 1, 9, 8, 4, 54),
  });

  await allFromUpstream(
    {
      payload: {
        op: 'UPDATE',
        table: 'public.encounters',
        id: encounterId,
      },
    },
    {
      log,
      sequelize: ctx.store.sequelize,
      models: ctx.store.models,
    },
  );

  await models.MediciReport.materialiseFromUpstream(encounterId);
  await models.MediciReport.materialiseFromUpstream(openEncounterId);

  const medici = await models.MediciReport.findOne();

  await medici.update({
    lastUpdated: new Date(Date.UTC(2022, 6 - 1, 12, 0, 2, 54, 225)),
  });

  return { patient, encounterId, encounterNote, imagingRequestNote, labRequestNote };
};

describe('fijiAspenMediciReport', () => {
  let ctx;
  let app;
  let models;
  let fakedata;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    app = await ctx.baseApp.asRole('practitioner');
    fakedata = await fakeAllData(models, ctx);
  });

  afterAll(() => ctx.close());

  describe('should filter encounters correctly', () => {
    it.each([
      // [ expectedResults, period.start, period.end ]
      [0, '2022-06-12T00:02:53-02:00', '2022-06-12T00:03:53-02:00'],
      [1, '2022-06-12T00:02:53Z', '2022-06-12T00:59:00Z'],
      [0, '2022-06-12T00:02:55Z', '2022-06-12T00:59:00Z'],
      [1, '2022-06-12T00:02:55+01:00', '2022-06-12T01:02:55+01:00'],
      [0, '2022-06-12T00:02:53-01:00', '2022-06-12T01:02:53-01:00'],
      // Dates/times input without timezone will be server timezone
      [
        0,
        createLocalDateTimeStringFromUTC(2022, 6 - 1, 12, 0, 2, 55).replace(' ', 'T'),
        createLocalDateTimeStringFromUTC(2022, 6 - 1, 12, 0, 59, 0).replace(' ', 'T'),
      ],
      [
        1,
        createLocalDateTimeStringFromUTC(2022, 6 - 1, 12, 0, 2, 53).replace(' ', 'T'),
        createLocalDateTimeStringFromUTC(2022, 6 - 1, 12, 0, 59, 0).replace(' ', 'T'),
      ],
    ])(
      'Date filtering: Should return %p result(s) between %p and %s',
      async (expectedResults, start, end) => {
        const query = `period.start=${encodeURIComponent(start)}&period.end=${encodeURIComponent(
          end,
        )}`;
        const response = await app
          .get(`/api/integration/fijiAspenMediciReport?${query}`)
          .set({ 'X-Tamanu-Client': 'medici', 'X-Version': '0.0.1' });

        expect(response).toHaveSucceeded();
        expect(response.body.data.length).toEqual(expectedResults);
      },
    );

    it('should filter by encounter id - 0 results', async () => {
      const query = `period.start=2022-06-12T00:00:00Z&period.end=2022-06-12T00:59:00Z&encounters=${encodeURIComponent(
        ['nonexistent-id'],
      )}`;
      const response = await app
        .get(`/api/integration/fijiAspenMediciReport?${query}`)
        .set({ 'X-Tamanu-Client': 'medici', 'X-Version': '0.0.1' });

      expect(response).toHaveSucceeded();
      expect(response.body.data.length).toEqual(0);
    });

    it('should filter by encounter id - 1 result', async () => {
      const query = `period.start=2022-06-12T00:00:00Z&period.end=2022-06-12T00:59:00Z&encounters=${encodeURIComponent(
        [fakedata.encounterId, 'nonexistent-id'],
      )}`;
      const response = await app
        .get(`/api/integration/fijiAspenMediciReport?${query}`)
        .set({ 'X-Tamanu-Client': 'medici', 'X-Version': '0.0.1' });
      expect(response).toHaveSucceeded();
      expect(response.body.data.length).toEqual(1);
    });
  });

  it('should fail if period.start and period.end are not provided', async () => {
    const response = await app
      .get('/api/integration/fijiAspenMediciReport')
      .set({ 'X-Tamanu-Client': 'medici', 'X-Version': '0.0.1' });

    expect(response.status).toBe(422);
    expect(response.body.error.name).toBe('InvalidOperationError');
  });

  it('should not fail if period.start and period.end are not provided but encounters are provided', async () => {
    const query = `encounters=${encodeURIComponent([fakedata.encounterId])}`;
    const response = await app
      .get(`/api/integration/fijiAspenMediciReport?${query}`)
      .set({ 'X-Tamanu-Client': 'medici', 'X-Version': '0.0.1' });

    expect(response).toHaveSucceeded();
    expect(response.body.data.length).toEqual(1);
  });

  it('should fail if period.start is provided but period.end is not provided', async () => {
    const query = `period.start=2022-06-12T00:00:00Z&encounters=${encodeURIComponent([
      fakedata.encounterId,
    ])}`;
    const response = await app
      .get(`/api/integration/fijiAspenMediciReport?${query}`)
      .set({ 'X-Tamanu-Client': 'medici', 'X-Version': '0.0.1' });

    expect(response.status).toBe(422);
    expect(response.body.error.name).toBe('InvalidOperationError');
  });

  it('should fail if period.end is provided but period.start is not provided', async () => {
    const query = `period.end=2022-06-12T00:00:00Z&encounters=${encodeURIComponent([
      fakedata.encounterId,
    ])}`;
    const response = await app
      .get(`/api/integration/fijiAspenMediciReport?${query}`)
      .set({ 'X-Tamanu-Client': 'medici', 'X-Version': '0.0.1' });

    expect(response.status).toBe(422);
    expect(response.body.error.name).toBe('InvalidOperationError');
  });

  it('should fail if period.start and period.end are not within 1 hour', async () => {
    const response = await app
      .get(
        '/api/integration/fijiAspenMediciReport?period.start=2022-05-09T00:00:00Z&period.end=2022-05-09T01:00:01Z',
      )
      .set({ 'X-Tamanu-Client': 'medici', 'X-Version': '0.0.1' });

    expect(response.status).toBe(422);
    expect(response.body.error.name).toBe('InvalidOperationError');
  });

  it(`Should produce a simple report`, async () => {
    const { patient, encounterId } = fakedata;
    // Not a precise checker, only overall shape - the report is grabbing that from a
    // date time string field so it does not matter much in this context
    const isoStringRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+00:00$/;
    // act
    const response = await app
      .get(
        '/api/integration/fijiAspenMediciReport?period.start=2022-06-12T00:00:00Z&period.end=2022-06-12T00:59:00Z',
      )
      .set({ 'X-Tamanu-Client': 'medici', 'X-Version': '0.0.1' });

    // assert
    expect(response).toHaveSucceeded();
    expect(response.body.data).toEqual([
      {
        // Patient Details
        patientId: 'BTIO864386',
        firstName: patient.firstName,
        lastName: patient.lastName,
        lastUpdated: '2022-06-12T00:02:54+00:00',
        dateOfBirth: '1952-10-12',
        age: expect.any(Number), // TODO
        sex: upperFirst(patient.sex),

        // Encounter Details
        encounterId,
        patientBillingType: 'Public',
        // Note that seconds is the highest level of precision - so the milliseconds are truncated
        encounterStartDate: '2022-06-09T00:02:54+00:00',
        encounterEndDate: '2022-06-12T00:02:54+00:00',
        dischargeDate: '2022-06-12T00:02:54+00:00',
        encounterType: [
          {
            startDate: expect.stringMatching(isoStringRegex),
            type: 'AR-DRG',
          },
          {
            startDate: expect.stringMatching(isoStringRegex),
            type: 'AR-DRG',
          },
        ],
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
        triageCategory: '2',
        waitTime: '1:3', // h:m

        // Location/Department
        locations: [
          {
            assignedTime: '2022-06-09T00:02:54+00:00',
            facility: 'Ba Hospital',
            location: 'Emergency room 1',
            locationGroup: 'Emergency Department',
          },
          {
            facility: 'Ba Hospital',
            location: 'Emergency room 2',
            locationGroup: 'Emergency Department',
            assignedTime: '2022-06-09T08:04:54+00:00',
          },
        ],
        departments: [
          {
            department: 'Emergency dept.',
            assignedTime: '2022-06-09T00:02:54+00:00',
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
            doseLabel: 'Dose 1',
          },
        ],
        procedures: [
          {
            name: 'Subtemporal cranial decompression (pseudotumor cerebri, slit ventricle syndrome)',
            code: '61340',
            date: '2022-06-11T01:20:54+00:00',
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
                noteTypeId: NOTE_TYPES.OTHER,
                content: 'Please perform this lab test very carefully',
                noteDate: '2022-06-09T02:04:54+00:00',
                revisedById: fakedata.labRequestNote.id,
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
                noteTypeId: NOTE_TYPES.OTHER,
                content: 'Check for fractured knees please',
                noteDate: '2022-06-10T06:04:54+00:00',
                revisedById: fakedata.imagingRequestNote.id,
              },
            ],
          },
        ],
        notes: [
          {
            noteTypeId: NOTE_TYPES.OTHER,
            content: 'A\nB\nC\nD\nE\nF\nG\n',
            noteDate: '2022-06-10T03:39:57+00:00',
            revisedById: fakedata.encounterNote.id,
          },
        ],
      },
    ]);
  });
});
