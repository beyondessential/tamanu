import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import config from 'config';
import { addDays, format, parseISO } from 'date-fns';

import {
  APPOINTMENT_STATUSES,
  PROGRAM_DATA_ELEMENT_TYPES,
  SETTINGS_SCOPES,
} from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { settingsCache } from '@tamanu/settings';
import { getCurrentPrimaryTimeZoneDateString } from '@tamanu/shared/utils/primaryDateTime';
import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';
import { getPrimaryTimeZone } from '@tamanu/shared/utils/timeZoneCheck';
import { getCurrentDateStringInTimezone, getDayBoundaries } from '@tamanu/utils/dateTime';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

import { createTestContext } from '../utilities';

const shiftDate = (date, days) => format(addDays(parseISO(date), days), 'yyyy-MM-dd');

describe('Kiosk', () => {
  const [facilityId] = selectFacilityIds(config);
  let ctx;
  let models;
  let app;
  let otherFacility;
  let locationGroup;
  let otherFacilityLocationGroup;
  let location;
  let defaultLocation;
  let today;
  let survey;
  let requiredDataElement;
  let appointmentTypeWithForms;
  let appointmentTypeWithoutForms;

  const setKioskSettings = async settings => {
    await models.Setting.set('kiosk', settings, SETTINGS_SCOPES.FACILITY, facilityId);
    settingsCache.reset();
  };

  const createPatient = overrides =>
    models.Patient.create({ ...fake(models.Patient), ...overrides });

  const createAppointment = async ({ patient, ...overrides }) =>
    models.Appointment.create({
      ...fake(models.Appointment),
      patientId: patient.id,
      clinicianId: app.user.id,
      locationGroupId: locationGroup.id,
      appointmentTypeId: appointmentTypeWithoutForms.id,
      startTime: `${today} 10:30:00`,
      endTime: `${today} 11:00:00`,
      status: APPOINTMENT_STATUSES.CONFIRMED,
      ...overrides,
    });

  const findAppointments = (lastName, dateOfBirth) =>
    app.get('/api/kiosk/appointments').query({ lastName, dateOfBirth });

  const createSurveyWithQuestion = async (
    dataElementOverrides = { type: PROGRAM_DATA_ELEMENT_TYPES.TEXT },
    componentOverrides = {},
  ) => {
    const newSurvey = await models.Survey.create(
      fake(models.Survey, { programId: survey.programId, surveyType: 'programs' }),
    );
    const dataElement = await models.ProgramDataElement.create(
      fake(models.ProgramDataElement, dataElementOverrides),
    );
    await models.SurveyScreenComponent.create(
      fake(models.SurveyScreenComponent, {
        surveyId: newSurvey.id,
        dataElementId: dataElement.id,
        screenIndex: 0,
        componentIndex: 0,
        calculation: '',
        ...componentOverrides,
      }),
    );
    return { survey: newSurvey, dataElement };
  };

  const createAppointmentTypeWithForms = async surveyIds => {
    const appointmentType = await models.ReferenceData.create(
      fake(models.ReferenceData, { type: 'appointmentType' }),
    );
    await setKioskSettings({
      enabled: true,
      formsByAppointmentType: [{ appointmentTypeId: appointmentType.id, surveyIds }],
    });
    return appointmentType;
  };

  const findPatientResponses = patient =>
    models.SurveyResponse.findAll({
      include: [
        { association: 'encounter', where: { patientId: patient.id }, include: ['location'] },
      ],
    });

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    app = await ctx.baseApp.asRole('practitioner');
    today = getCurrentPrimaryTimeZoneDateString();

    otherFacility = await models.Facility.create(fake(models.Facility));
    locationGroup = await models.LocationGroup.create(fake(models.LocationGroup, { facilityId }));
    otherFacilityLocationGroup = await models.LocationGroup.create(
      fake(models.LocationGroup, { facilityId: otherFacility.id }),
    );
    location = await models.Location.create(fake(models.Location, { facilityId }));
    defaultLocation = await models.Location.create(fake(models.Location, { facilityId }));
    await models.Setting.set(
      'survey.defaultCodes.location',
      defaultLocation.code,
      SETTINGS_SCOPES.FACILITY,
      facilityId,
    );
    const department = await models.Department.create(fake(models.Department, { facilityId }));
    await models.Setting.set(
      'survey.defaultCodes.department',
      department.code,
      SETTINGS_SCOPES.FACILITY,
      facilityId,
    );

    appointmentTypeWithForms = await models.ReferenceData.create(
      fake(models.ReferenceData, { type: 'appointmentType' }),
    );
    appointmentTypeWithoutForms = await models.ReferenceData.create(
      fake(models.ReferenceData, { type: 'appointmentType' }),
    );

    const program = await models.Program.create(fake(models.Program));
    survey = await models.Survey.create(
      fake(models.Survey, { programId: program.id, surveyType: 'programs' }),
    );
    requiredDataElement = await models.ProgramDataElement.create(
      fake(models.ProgramDataElement, { type: PROGRAM_DATA_ELEMENT_TYPES.TEXT }),
    );
    await models.SurveyScreenComponent.create(
      fake(models.SurveyScreenComponent, {
        surveyId: survey.id,
        dataElementId: requiredDataElement.id,
        screenIndex: 0,
        componentIndex: 0,
        calculation: '',
        validationCriteria: JSON.stringify({ mandatory: true }),
      }),
    );
  });

  beforeEach(async () => {
    await setKioskSettings({
      enabled: true,
      formsByAppointmentType: [
        { appointmentTypeId: appointmentTypeWithForms.id, surveyIds: [survey.id] },
      ],
    });
  });

  afterAll(() => ctx.close());

  describe('Finding an appointment', () => {
    it('still hides part of a short patient ID when masking', async () => {
      const dateOfBirth = '1966-06-06';
      const lastName = 'Shortid';
      const first = await createPatient({ lastName, dateOfBirth, displayId: 'AB12' });
      const second = await createPatient({ lastName, dateOfBirth, displayId: 'CD3' });
      await createAppointment({ patient: first });
      await createAppointment({ patient: second });

      const result = await findAppointments(lastName, dateOfBirth);

      expect(result).toHaveSucceeded();
      expect(result.body.data.map(({ patient }) => patient.displayId).sort()).toEqual([
        'AB1*',
        'CD*',
      ]);
    });

    it('does not mask a single patient with two appointments today', async () => {
      const patient = await createPatient({ lastName: 'Twice', dateOfBirth: '1977-04-04' });
      await createAppointment({ patient });
      await createAppointment({ patient, startTime: `${today} 15:00:00` });

      const result = await findAppointments('Twice', '1977-04-04');

      expect(result).toHaveSucceeded();
      expect(result.body.data).toHaveLength(2);
      expect(result.body.isSeveralPatients).toBe(false);
      expect(result.body.data[0].patient.displayId).toEqual(patient.displayId);
      expect(result.body.data[0].clinician).not.toBeNull();
    });

    it('finds a patient with an appointment today by last name and date of birth', async () => {
      const patient = await createPatient({ lastName: 'Taufa', dateOfBirth: '1986-03-14' });
      const appointment = await createAppointment({ patient });

      const result = await findAppointments('  tAUFA ', '1986-03-14');

      expect(result).toHaveSucceeded();
      expect(result.body.data).toHaveLength(1);
      expect(result.body.data[0]).toMatchObject({
        id: appointment.id,
        status: APPOINTMENT_STATUSES.CONFIRMED,
        clinician: { displayName: app.user.displayName },
        patient: {
          firstName: patient.firstName,
          lastName: 'Taufa',
          dateOfBirth: '1986-03-14',
          displayId: patient.displayId,
        },
      });
    });

    it('does not find a patient with the wrong date of birth', async () => {
      const patient = await createPatient({ lastName: 'Lealaiauloto', dateOfBirth: '1990-01-01' });
      await createAppointment({ patient });

      const result = await findAppointments('Lealaiauloto', '1990-01-02');

      expect(result).toHaveSucceeded();
      expect(result.body.data).toHaveLength(0);
    });

    it('only finds appointments today at this facility that are still open', async () => {
      const dateOfBirth = '1971-07-07';
      const lastName = 'Fonoti';
      const patient = await createPatient({ lastName, dateOfBirth });
      await createAppointment({
        patient,
        startTime: `${shiftDate(today, 1)} 10:00:00`,
        endTime: `${shiftDate(today, 1)} 10:30:00`,
      });
      await createAppointment({
        patient,
        startTime: `${shiftDate(today, -1)} 10:00:00`,
        endTime: `${shiftDate(today, -1)} 10:30:00`,
      });
      await createAppointment({ patient, locationGroupId: otherFacilityLocationGroup.id });
      await createAppointment({ patient, status: APPOINTMENT_STATUSES.CANCELLED });
      await createAppointment({ patient, status: APPOINTMENT_STATUSES.NO_SHOW });

      const result = await findAppointments(lastName, dateOfBirth);

      expect(result).toHaveSucceeded();
      expect(result.body.data).toHaveLength(0);
    });

    it('finds location bookings at this facility', async () => {
      const patient = await createPatient({ lastName: 'Booking', dateOfBirth: '1960-02-02' });
      const appointment = await createAppointment({
        patient,
        locationGroupId: null,
        locationId: location.id,
      });

      const result = await findAppointments('Booking', '1960-02-02');

      expect(result).toHaveSucceeded();
      expect(result.body.data.map(({ id }) => id)).toEqual([appointment.id]);
    });

    it('masks the patient ID and hides the clinician when several patients match', async () => {
      const dateOfBirth = '1986-05-20';
      const lastName = 'Tupou';
      const first = await createPatient({ lastName, dateOfBirth });
      const second = await createPatient({ lastName, dateOfBirth });
      await createAppointment({ patient: first });
      await createAppointment({ patient: second, startTime: `${today} 14:15:00` });

      const result = await findAppointments(lastName, dateOfBirth);

      expect(result).toHaveSucceeded();
      expect(result.body.data).toHaveLength(2);
      expect(result.body.isSeveralPatients).toBe(true);
      for (const match of result.body.data) {
        expect(match.clinician).toBeNull();
        expect(match.patient.displayId).toMatch(/^.{4}\*+$/);
      }
      expect(result.body.data[0].patient.displayId).toHaveLength(first.displayId.length);
    });

    it('reports an appointment already marked arrived', async () => {
      const patient = await createPatient({ lastName: 'Arrived', dateOfBirth: '1950-12-12' });
      await createAppointment({ patient, status: APPOINTMENT_STATUSES.ARRIVED });

      const result = await findAppointments('Arrived', '1950-12-12');

      expect(result).toHaveSucceeded();
      expect(result.body.data[0].status).toEqual(APPOINTMENT_STATUSES.ARRIVED);
    });

    it('rejects a search without a valid date of birth', async () => {
      const result = await findAppointments('Taufa', '14/03/1986');
      expect(result).toHaveRequestError();
    });

    it('is unavailable when the kiosk is turned off for the facility', async () => {
      await setKioskSettings({ enabled: false });
      const result = await findAppointments('Taufa', '1986-03-14');
      expect(result).toHaveRequestError();
    });

    it('is forbidden without permission to read appointments', async () => {
      const limitedApp = await ctx.baseApp.asRole('base');
      const result = await limitedApp
        .get('/api/kiosk/appointments')
        .query({ lastName: 'Taufa', dateOfBirth: '1986-03-14' });
      expect(result).toBeForbidden();
    });

    describe('with a facility time zone', () => {
      afterEach(async () => {
        await models.Setting.set('facilityTimeZone', null, SETTINGS_SCOPES.FACILITY, facilityId);
        settingsCache.reset();
      });

      it("finds appointments on the facility's today, not the primary time zone's", async () => {
        const primaryTimeZone = getPrimaryTimeZone();
        const primaryToday = getCurrentDateStringInTimezone(primaryTimeZone);
        const facilityTimeZone = ['Pacific/Kiritimati', 'Etc/GMT+12'].find(
          timeZone => getCurrentDateStringInTimezone(timeZone) !== primaryToday,
        );
        await models.Setting.set(
          'facilityTimeZone',
          facilityTimeZone,
          SETTINGS_SCOPES.FACILITY,
          facilityId,
        );
        settingsCache.reset();
        const facilityDay = getDayBoundaries(
          getCurrentDateStringInTimezone(facilityTimeZone),
          primaryTimeZone,
          facilityTimeZone,
        );
        const isOnPrimaryToday = dateTime => dateTime.startsWith(primaryToday);
        const isOnFacilityToday = dateTime =>
          dateTime >= facilityDay.start && dateTime <= facilityDay.end;
        const facilityTodayOnly = [facilityDay.start, facilityDay.end].find(
          dateTime => !isOnPrimaryToday(dateTime),
        );
        const primaryTodayOnly = [`${primaryToday} 00:00:30`, `${primaryToday} 23:59:30`].find(
          dateTime => !isOnFacilityToday(dateTime),
        );

        const dateOfBirth = '1982-08-08';
        const lastName = 'Zoned';
        const patient = await createPatient({ lastName, dateOfBirth });
        const facilityTodayAppointment = await createAppointment({
          patient,
          startTime: facilityTodayOnly,
          endTime: facilityTodayOnly,
        });
        await createAppointment({
          patient,
          startTime: primaryTodayOnly,
          endTime: primaryTodayOnly,
        });

        const result = await findAppointments(lastName, dateOfBirth);

        expect(result).toHaveSucceeded();
        expect(result.body.data.map(({ id }) => id)).toEqual([facilityTodayAppointment.id]);
      });
    });
  });

  describe('Loading forms', () => {
    it('is forbidden without permission to read appointments, patients and forms', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({ patient });
      const limitedApp = await ctx.baseApp.asRole('base');

      const result = await limitedApp.get(`/api/kiosk/appointments/${appointment.id}`);

      expect(result).toBeForbidden();
    });

    it('sends only the parts of the patient record the forms use', async () => {
      const patient = await createPatient({ lastName: 'Private', dateOfBirth: '1980-01-01' });
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentTypeWithForms.id,
      });

      const result = await app.get(`/api/kiosk/appointments/${appointment.id}`);

      expect(result).toHaveSucceeded();
      expect(Object.keys(result.body.patient).sort()).toEqual(
        ['dateOfBirth', 'fieldValues', 'firstName', 'id', 'lastName'].sort(),
      );
      expect(result.body.patientAdditionalData).toBeNull();
    });

    it('sends the patient fields its patient-data questions show, and no others', async () => {
      const { survey: patientDataSurvey } = await createSurveyWithQuestion(
        { type: PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA },
        { config: JSON.stringify({ column: 'email' }) },
      );
      const contactNumberElement = await models.ProgramDataElement.create(
        fake(models.ProgramDataElement, { type: PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA }),
      );
      await models.SurveyScreenComponent.create(
        fake(models.SurveyScreenComponent, {
          surveyId: patientDataSurvey.id,
          dataElementId: contactNumberElement.id,
          screenIndex: 0,
          componentIndex: 1,
          calculation: '',
          config: JSON.stringify({ column: 'primaryContactNumber' }),
        }),
      );
      const appointmentType = await createAppointmentTypeWithForms([patientDataSurvey.id]);
      const patient = await createPatient({ email: 'kiosk@example.com' });
      await models.PatientAdditionalData.create({
        ...fake(models.PatientAdditionalData),
        patientId: patient.id,
        primaryContactNumber: '021 555 0101',
        secondaryContactNumber: '021 555 0202',
      });
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentType.id,
      });

      const result = await app.get(`/api/kiosk/appointments/${appointment.id}`);

      expect(result).toHaveSucceeded();
      expect(result.body.patient).toEqual({
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
        email: 'kiosk@example.com',
        fieldValues: [],
      });
      expect(result.body.patientAdditionalData).toEqual({ primaryContactNumber: '021 555 0101' });
    });

    it('leaves out forms that have been retired', async () => {
      const retired = await models.Survey.create(
        fake(models.Survey, {
          programId: survey.programId,
          surveyType: 'programs',
          visibilityStatus: 'historical',
        }),
      );
      await setKioskSettings({
        enabled: true,
        formsByAppointmentType: [
          { appointmentTypeId: appointmentTypeWithForms.id, surveyIds: [retired.id, survey.id] },
        ],
      });
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentTypeWithForms.id,
      });

      const forms = await app.get(`/api/kiosk/appointments/${appointment.id}`);
      expect(forms.body.forms.map(({ id }) => id)).toEqual([survey.id]);

      const checkIn = await app.post(`/api/kiosk/appointments/${appointment.id}/checkIn`).send({
        responses: [{ surveyId: survey.id, answers: { [requiredDataElement.id]: 'Fine' } }],
      });
      expect(checkIn).toHaveSucceeded();
    });

    it('returns the patient and the forms for the appointment type', async () => {
      const patient = await createPatient({ lastName: 'Forms', dateOfBirth: '1980-01-01' });
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentTypeWithForms.id,
      });

      const result = await app.get(`/api/kiosk/appointments/${appointment.id}`);

      expect(result).toHaveSucceeded();
      expect(result.body.patient.id).toEqual(patient.id);
      expect(result.body.appointment.patient.displayId).toEqual(patient.displayId);
      expect(result.body.forms).toHaveLength(1);
      expect(result.body.forms[0].id).toEqual(survey.id);
      expect(result.body.forms[0].components[0].dataElement.id).toEqual(requiredDataElement.id);
    });

    it('returns no forms for an appointment type without any', async () => {
      const patient = await createPatient({ lastName: 'NoForms', dateOfBirth: '1980-01-01' });
      const appointment = await createAppointment({ patient });

      const result = await app.get(`/api/kiosk/appointments/${appointment.id}`);

      expect(result).toHaveSucceeded();
      expect(result.body.forms).toEqual([]);
    });

    it('does not load an appointment on another day', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        startTime: `${shiftDate(today, 1)} 10:00:00`,
        endTime: `${shiftDate(today, 1)} 10:30:00`,
      });

      const result = await app.get(`/api/kiosk/appointments/${appointment.id}`);

      expect(result).toHaveRequestError();
    });
  });

  describe('Checking in', () => {
    const checkIn = (appointmentId, responses) =>
      app.post(`/api/kiosk/appointments/${appointmentId}/checkIn`).send({ responses });

    it('does not move an appointment staff have already progressed', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({ patient, status: APPOINTMENT_STATUSES.SEEN });

      const result = await checkIn(appointment.id, []);

      expect(result).toHaveRequestError();
      await appointment.reload();
      expect(appointment.status).toEqual(APPOINTMENT_STATUSES.SEEN);
    });

    it('saves the forms and marks the appointment arrived', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentTypeWithForms.id,
      });

      const result = await checkIn(appointment.id, [
        { surveyId: survey.id, answers: { [requiredDataElement.id]: 'Headaches' } },
      ]);

      expect(result).toHaveSucceeded();
      await appointment.reload();
      expect(appointment.status).toEqual(APPOINTMENT_STATUSES.ARRIVED);

      const surveyResponses = await models.SurveyResponse.findAll({
        where: { surveyId: survey.id },
        include: ['encounter', 'answers'],
      });
      const surveyResponse = surveyResponses.find(
        response => response.encounter.patientId === patient.id,
      );
      expect(surveyResponse.userId).toEqual(app.user.id);
      expect(
        surveyResponse.answers.find(a => a.dataElementId === requiredDataElement.id).body,
      ).toEqual('Headaches');
    });

    it('checks in an appointment type without forms', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({ patient });

      const result = await checkIn(appointment.id, []);

      expect(result).toHaveSucceeded();
      await appointment.reload();
      expect(appointment.status).toEqual(APPOINTMENT_STATUSES.ARRIVED);
    });

    it('rejects check-in with a form missing and saves nothing', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentTypeWithForms.id,
      });

      const result = await checkIn(appointment.id, []);

      expect(result).toHaveRequestError();
      await appointment.reload();
      expect(appointment.status).toEqual(APPOINTMENT_STATUSES.CONFIRMED);
    });

    it('rejects a second check-in', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        status: APPOINTMENT_STATUSES.ARRIVED,
      });

      const result = await checkIn(appointment.id, []);

      expect(result).toHaveRequestError();
    });

    it('rejects an appointment at another facility', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        locationGroupId: otherFacilityLocationGroup.id,
      });

      const result = await checkIn(appointment.id, []);

      expect(result).toHaveRequestError();
      await appointment.reload();
      expect(appointment.status).toEqual(APPOINTMENT_STATUSES.CONFIRMED);
    });

    it('rejects an appointment on another day', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        startTime: `${shiftDate(today, 1)} 10:00:00`,
        endTime: `${shiftDate(today, 1)} 10:30:00`,
      });

      const result = await checkIn(appointment.id, []);

      expect(result).toHaveRequestError();
      await appointment.reload();
      expect(appointment.status).toEqual(APPOINTMENT_STATUSES.CONFIRMED);
    });

    it('saves nothing when one of the forms cannot be saved', async () => {
      const { survey: secondSurvey, dataElement: secondDataElement } =
        await createSurveyWithQuestion();
      const appointmentType = await createAppointmentTypeWithForms([survey.id, secondSurvey.id]);
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentType.id,
      });

      const result = await checkIn(appointment.id, [
        { surveyId: survey.id, answers: { [requiredDataElement.id]: 'Headaches' } },
        {
          surveyId: secondSurvey.id,
          answers: { [secondDataElement.id]: 'Fine', 'not-a-question': 'Unsaveable' },
        },
      ]);

      expect(result).not.toHaveSucceeded();
      expect(await findPatientResponses(patient)).toHaveLength(0);
      await appointment.reload();
      expect(appointment.status).toEqual(APPOINTMENT_STATUSES.CONFIRMED);
    });

    it('records how long the patient spent on each form', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentTypeWithForms.id,
      });

      const result = await checkIn(appointment.id, [
        {
          surveyId: survey.id,
          answers: { [requiredDataElement.id]: 'Headaches' },
          startTime: `${today} 09:15:00`,
          endTime: `${today} 09:18:00`,
        },
      ]);

      expect(result).toHaveSucceeded();
      const [surveyResponse] = await findPatientResponses(patient);
      expect(surveyResponse.startTime).toEqual(`${today} 09:15:00`);
      expect(surveyResponse.endTime).toEqual(`${today} 09:18:00`);
    });

    it('rejects a form time that is not a stored datetime', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentTypeWithForms.id,
      });

      const result = await checkIn(appointment.id, [
        {
          surveyId: survey.id,
          answers: { [requiredDataElement.id]: 'Headaches' },
          startTime: '2026-10-21T09:15:00.000Z',
        },
      ]);

      expect(result).toHaveRequestError();
      expect(await findPatientResponses(patient)).toHaveLength(0);
    });

    it("records the responses at the appointment's own location", async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentTypeWithForms.id,
        locationGroupId: null,
        locationId: location.id,
      });

      const result = await checkIn(appointment.id, [
        { surveyId: survey.id, answers: { [requiredDataElement.id]: 'Headaches' } },
      ]);

      expect(result).toHaveSucceeded();
      const [surveyResponse] = await findPatientResponses(patient);
      expect(surveyResponse.encounter.locationId).toEqual(location.id);
      expect(surveyResponse.encounter.location.facilityId).toEqual(facilityId);
    });

    it('records the responses at a location in the booked clinic', async () => {
      const clinic = await models.LocationGroup.create(fake(models.LocationGroup, { facilityId }));
      const clinicLocation = await models.Location.create(
        fake(models.Location, { facilityId, locationGroupId: clinic.id }),
      );
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentTypeWithForms.id,
        locationGroupId: clinic.id,
      });

      const result = await checkIn(appointment.id, [
        { surveyId: survey.id, answers: { [requiredDataElement.id]: 'Headaches' } },
      ]);

      expect(result).toHaveSucceeded();
      const [surveyResponse] = await findPatientResponses(patient);
      expect(surveyResponse.encounter.locationId).toEqual(clinicLocation.id);
    });

    it("records the responses at the facility's default location when the clinic has none", async () => {
      const emptyClinic = await models.LocationGroup.create(
        fake(models.LocationGroup, { facilityId }),
      );
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentTypeWithForms.id,
        locationGroupId: emptyClinic.id,
      });

      const result = await checkIn(appointment.id, [
        { surveyId: survey.id, answers: { [requiredDataElement.id]: 'Headaches' } },
      ]);

      expect(result).toHaveSucceeded();
      const [surveyResponse] = await findPatientResponses(patient);
      expect(surveyResponse.encounter.locationId).toEqual(defaultLocation.id);
    });

    it('checks in only once when two check-ins arrive together', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentTypeWithForms.id,
      });
      const responses = [
        { surveyId: survey.id, answers: { [requiredDataElement.id]: 'Headaches' } },
      ];

      const results = await Promise.all([
        checkIn(appointment.id, responses),
        checkIn(appointment.id, responses),
      ]);

      expect(results.filter(result => result.status < 400)).toHaveLength(1);
      expect(results.filter(result => result.status >= 400)).toHaveLength(1);
      expect(await findPatientResponses(patient)).toHaveLength(1);
    });

    describe('with permissions from the database', () => {
      disableHardcodedPermissionsForSuite();

      it('is forbidden without permission to create form responses', async () => {
        const patient = await createPatient();
        const appointment = await createAppointment({
          patient,
          appointmentTypeId: appointmentTypeWithForms.id,
        });
        const limitedApp = await ctx.baseApp.asNewRole([
          ['read', 'Appointment'],
          ['write', 'Appointment'],
          ['read', 'Patient'],
        ]);

        const result = await limitedApp
          .post(`/api/kiosk/appointments/${appointment.id}/checkIn`)
          .send({
            responses: [
              { surveyId: survey.id, answers: { [requiredDataElement.id]: 'Headaches' } },
            ],
          });

        expect(result).toBeForbidden();
        expect(await findPatientResponses(patient)).toHaveLength(0);
        await appointment.reload();
        expect(appointment.status).toEqual(APPOINTMENT_STATUSES.CONFIRMED);
      });

      it('is forbidden without permission to read patients', async () => {
        const patient = await createPatient();
        const appointment = await createAppointment({ patient });
        const limitedApp = await ctx.baseApp.asNewRole([
          ['read', 'Appointment'],
          ['write', 'Appointment'],
        ]);

        const result = await limitedApp
          .post(`/api/kiosk/appointments/${appointment.id}/checkIn`)
          .send({ responses: [] });

        expect(result).toBeForbidden();
        await appointment.reload();
        expect(appointment.status).toEqual(APPOINTMENT_STATUSES.CONFIRMED);
      });
    });

    it('is forbidden without permission to update appointments', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({ patient });
      const limitedApp = await ctx.baseApp.asRole('base');

      const result = await limitedApp
        .post(`/api/kiosk/appointments/${appointment.id}/checkIn`)
        .send({ responses: [] });

      expect(result).toBeForbidden();
    });
  });
});
