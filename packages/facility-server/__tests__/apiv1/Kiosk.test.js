import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import config from 'config';
import { addDays, format, parseISO } from 'date-fns';

import {
  APPOINTMENT_STATUSES,
  PROGRAM_DATA_ELEMENT_TYPES,
  SETTINGS_SCOPES,
} from '@tamanu/constants';
import { createDummyEncounter } from '@tamanu/database/demoData/patients';
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
  let bookingTypeWithForms;

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

  const createLocationBooking = overrides =>
    createAppointment({
      locationGroupId: null,
      locationId: location.id,
      appointmentTypeId: null,
      bookingTypeId: bookingTypeWithForms.id,
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
      forms: [{ appointmentTypeId: appointmentType.id, surveyIds }],
    });
    return appointmentType;
  };

  const findPatientResponses = patient =>
    models.SurveyResponse.findAll({
      include: [
        { association: 'encounter', where: { patientId: patient.id }, include: ['location'] },
      ],
      order: [['createdAt', 'ASC']],
    });

  const submitForm = (appointmentId, surveyId, body, agent = app) =>
    agent.post(`/api/kiosk/appointments/${appointmentId}/forms/${surveyId}`).send(body);

  const checkIn = (appointmentId, agent = app) =>
    agent.post(`/api/kiosk/appointments/${appointmentId}/checkIn`);

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
    bookingTypeWithForms = await models.ReferenceData.create(
      fake(models.ReferenceData, { type: 'bookingType' }),
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
      forms: [
        { appointmentTypeId: appointmentTypeWithForms.id, surveyIds: [survey.id] },
        { bookingTypeId: bookingTypeWithForms.id, surveyIds: [survey.id] },
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
      const booking = await createLocationBooking({ patient });
      const otherLocation = await models.Location.create(
        fake(models.Location, { facilityId: otherFacility.id }),
      );
      await createLocationBooking({ patient, locationId: otherLocation.id });

      const result = await findAppointments('Booking', '1960-02-02');

      expect(result).toHaveSucceeded();
      expect(result.body.data.map(({ id }) => id)).toEqual([booking.id]);
    });

    it('offers one patient their outpatient appointment and location booking together', async () => {
      const patient = await createPatient({ lastName: 'Both', dateOfBirth: '1961-03-03' });
      const appointment = await createAppointment({ patient });
      const booking = await createLocationBooking({ patient, startTime: `${today} 13:00:00` });

      const result = await findAppointments('Both', '1961-03-03');

      expect(result).toHaveSucceeded();
      expect(result.body.isSeveralPatients).toBe(false);
      expect(result.body.data.map(({ id }) => id)).toEqual([appointment.id, booking.id]);
      expect(result.body.data[1].patient.displayId).toEqual(patient.displayId);
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

    it('is forbidden without permission to run the kiosk', async () => {
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
    it('is forbidden without permission to run the kiosk', async () => {
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

    it("sends the name for a full-name question without looking up the patient's custom fields", async () => {
      const { survey: fullNameSurvey } = await createSurveyWithQuestion(
        { type: PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA },
        { config: JSON.stringify({ column: 'fullName' }) },
      );
      const appointmentType = await createAppointmentTypeWithForms([fullNameSurvey.id]);
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentType.id,
      });
      const findFieldValues = vi.spyOn(models.PatientFieldValue, 'findAll');

      try {
        const result = await app.get(`/api/kiosk/appointments/${appointment.id}`);

        expect(result).toHaveSucceeded();
        expect(result.body.patient).toMatchObject({
          firstName: patient.firstName,
          lastName: patient.lastName,
          fieldValues: [],
        });
        expect(findFieldValues).not.toHaveBeenCalled();
      } finally {
        findFieldValues.mockRestore();
      }
    });

    it('is unavailable when the kiosk is turned off for the facility', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentTypeWithForms.id,
      });
      await setKioskSettings({ enabled: false });

      const result = await app.get(`/api/kiosk/appointments/${appointment.id}`);

      expect(result).toHaveRequestError();
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
        forms: [
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

      expect(
        await submitForm(appointment.id, survey.id, {
          answers: { [requiredDataElement.id]: 'Fine' },
        }),
      ).toHaveSucceeded();
      expect(await checkIn(appointment.id)).toHaveSucceeded();
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

    it("returns the forms for a location booking's booking type", async () => {
      const patient = await createPatient();
      const booking = await createLocationBooking({ patient });

      const result = await app.get(`/api/kiosk/appointments/${booking.id}`);

      expect(result).toHaveSucceeded();
      expect(result.body.forms.map(({ id }) => id)).toEqual([survey.id]);
    });

    it('returns no forms for a booking type without any', async () => {
      const bookingTypeWithoutForms = await models.ReferenceData.create(
        fake(models.ReferenceData, { type: 'bookingType' }),
      );
      const patient = await createPatient();
      const booking = await createLocationBooking({
        patient,
        bookingTypeId: bookingTypeWithoutForms.id,
      });

      const result = await app.get(`/api/kiosk/appointments/${booking.id}`);

      expect(result).toHaveSucceeded();
      expect(result.body.forms).toEqual([]);
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

  describe('Submitting forms', () => {
    const headaches = () => ({ answers: { [requiredDataElement.id]: 'Headaches' } });

    it('saves a finished form straight away, tagged with the appointment', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentTypeWithForms.id,
      });

      const result = await submitForm(appointment.id, survey.id, headaches());

      expect(result).toHaveSucceeded();
      const [surveyResponse] = await models.SurveyResponse.findAll({
        where: { id: result.body.surveyResponseId },
        include: ['answers'],
      });
      expect(surveyResponse.userId).toEqual(app.user.id);
      expect(surveyResponse.metadata).toEqual({ appointmentId: appointment.id });
      expect(
        surveyResponse.answers.find(a => a.dataElementId === requiredDataElement.id).body,
      ).toEqual('Headaches');
      await appointment.reload();
      expect(appointment.status).toEqual(APPOINTMENT_STATUSES.CONFIRMED);
    });

    it('reports the submitted forms when the appointment is loaded again', async () => {
      const { survey: secondSurvey } = await createSurveyWithQuestion();
      const appointmentType = await createAppointmentTypeWithForms([survey.id, secondSurvey.id]);
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentType.id,
      });

      expect(await submitForm(appointment.id, survey.id, headaches())).toHaveSucceeded();

      const result = await app.get(`/api/kiosk/appointments/${appointment.id}`);
      expect(result).toHaveSucceeded();
      expect(result.body.submittedSurveyIds).toEqual([survey.id]);
    });

    it("doesn't count a form submitted for another of the patient's appointments", async () => {
      const patient = await createPatient();
      const [morning, afternoon] = await Promise.all([
        createAppointment({ patient, appointmentTypeId: appointmentTypeWithForms.id }),
        createAppointment({
          patient,
          appointmentTypeId: appointmentTypeWithForms.id,
          startTime: `${today} 14:00:00`,
          endTime: `${today} 14:30:00`,
        }),
      ]);

      expect(await submitForm(morning.id, survey.id, headaches())).toHaveSucceeded();

      const result = await app.get(`/api/kiosk/appointments/${afternoon.id}`);
      expect(result.body.submittedSurveyIds).toEqual([]);
      expect(await checkIn(afternoon.id)).toHaveRequestError();
    });

    it('records later forms in the same new encounter, not one still open from an earlier visit', async () => {
      const { survey: secondSurvey, dataElement: secondDataElement } =
        await createSurveyWithQuestion();
      const appointmentType = await createAppointmentTypeWithForms([survey.id, secondSurvey.id]);
      const patient = await createPatient();
      const otherFacilityLocation = await models.Location.create(
        fake(models.Location, { facilityId: otherFacility.id }),
      );
      const otherFacilityDepartment = await models.Department.create(
        fake(models.Department, { facilityId: otherFacility.id }),
      );
      const openEncounter = await models.Encounter.create({
        ...(await createDummyEncounter(models, { current: true })),
        patientId: patient.id,
        locationId: otherFacilityLocation.id,
        departmentId: otherFacilityDepartment.id,
        examinerId: app.user.id,
      });
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentType.id,
        locationGroupId: null,
        locationId: location.id,
      });

      expect(await submitForm(appointment.id, survey.id, headaches())).toHaveSucceeded();
      expect(
        await submitForm(appointment.id, secondSurvey.id, {
          answers: { [secondDataElement.id]: 'Fine' },
        }),
      ).toHaveSucceeded();

      const surveyResponses = await findPatientResponses(patient);
      expect(surveyResponses).toHaveLength(2);
      const [{ encounter }] = surveyResponses;
      expect(encounter.id).not.toEqual(openEncounter.id);
      expect(encounter.locationId).toEqual(location.id);
      expect(surveyResponses[1].encounterId).toEqual(encounter.id);
      await openEncounter.reload();
      expect(openEncounter.endDate).toBeNull();
    });

    it('refuses a form that has already been submitted and keeps the first answers', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentTypeWithForms.id,
      });
      expect(await submitForm(appointment.id, survey.id, headaches())).toHaveSucceeded();

      const result = await submitForm(appointment.id, survey.id, {
        answers: { [requiredDataElement.id]: 'Changed my mind' },
      });

      expect(result).toHaveRequestError();
      const surveyResponses = await models.SurveyResponse.findAll({
        include: [{ association: 'encounter', where: { patientId: patient.id } }, 'answers'],
      });
      expect(surveyResponses).toHaveLength(1);
      expect(surveyResponses[0].answers[0].body).toEqual('Headaches');
    });

    it('takes one of two submissions of the same form arriving together', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentTypeWithForms.id,
      });

      const results = await Promise.all([
        submitForm(appointment.id, survey.id, headaches()),
        submitForm(appointment.id, survey.id, headaches()),
      ]);

      expect(results.filter(result => result.status < 400)).toHaveLength(1);
      expect(results.filter(result => result.status >= 400)).toHaveLength(1);
      expect(await findPatientResponses(patient)).toHaveLength(1);
    });

    it('refuses a form the appointment does not ask for', async () => {
      const { survey: otherSurvey, dataElement: otherDataElement } =
        await createSurveyWithQuestion();
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentTypeWithForms.id,
      });

      const result = await submitForm(appointment.id, otherSurvey.id, {
        answers: { [otherDataElement.id]: 'Fine' },
      });

      expect(result).toHaveRequestError();
      expect(await findPatientResponses(patient)).toHaveLength(0);
    });

    it('refuses a form once the appointment has been checked in', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentTypeWithForms.id,
        status: APPOINTMENT_STATUSES.ARRIVED,
      });

      expect(await submitForm(appointment.id, survey.id, headaches())).toHaveRequestError();
      expect(await findPatientResponses(patient)).toHaveLength(0);
    });

    it('refuses an appointment at another facility or on another day', async () => {
      const patient = await createPatient();
      const elsewhere = await createAppointment({
        patient,
        appointmentTypeId: appointmentTypeWithForms.id,
        locationGroupId: otherFacilityLocationGroup.id,
      });
      const tomorrow = await createAppointment({
        patient,
        appointmentTypeId: appointmentTypeWithForms.id,
        startTime: `${shiftDate(today, 1)} 10:00:00`,
        endTime: `${shiftDate(today, 1)} 10:30:00`,
      });

      expect(await submitForm(elsewhere.id, survey.id, headaches())).toHaveRequestError();
      expect(await submitForm(tomorrow.id, survey.id, headaches())).toHaveRequestError();
      expect(await findPatientResponses(patient)).toHaveLength(0);
    });

    it('saves nothing when the form cannot be saved', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentTypeWithForms.id,
      });

      const result = await submitForm(appointment.id, survey.id, {
        answers: { [requiredDataElement.id]: 'Headaches', 'not-a-question': 'Unsaveable' },
      });

      expect(result).not.toHaveSucceeded();
      expect(await findPatientResponses(patient)).toHaveLength(0);
    });

    it('records how long the patient spent on the form', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentTypeWithForms.id,
      });

      const result = await submitForm(appointment.id, survey.id, {
        ...headaches(),
        startTime: `${today} 09:15:00`,
        endTime: `${today} 09:18:00`,
      });

      expect(result).toHaveSucceeded();
      const [surveyResponse] = await findPatientResponses(patient);
      expect(surveyResponse.startTime).toEqual(`${today} 09:15:00`);
      expect(surveyResponse.endTime).toEqual(`${today} 09:18:00`);
    });

    it.each([
      ['that is not a stored datetime', () => ({ startTime: '2026-10-21T09:15:00.000Z' })],
      [
        'finished before it was started',
        () => ({ startTime: `${today} 09:18:00`, endTime: `${today} 09:15:00` }),
      ],
      [
        'on another day',
        () => ({ startTime: `${shiftDate(today, -1)} 09:15:00`, endTime: `${today} 09:18:00` }),
      ],
    ])('refuses a form time %s and saves nothing', async (_, getTimes) => {
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentTypeWithForms.id,
      });

      const result = await submitForm(appointment.id, survey.id, {
        ...headaches(),
        ...getTimes(),
      });

      expect(result).toHaveRequestError();
      expect(await findPatientResponses(patient)).toHaveLength(0);
    });

    it('is unavailable when the kiosk is turned off and saves nothing', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentTypeWithForms.id,
      });
      await setKioskSettings({
        enabled: false,
        forms: [{ appointmentTypeId: appointmentTypeWithForms.id, surveyIds: [survey.id] }],
      });

      expect(await submitForm(appointment.id, survey.id, headaches())).toHaveRequestError();
      expect(await findPatientResponses(patient)).toHaveLength(0);
    });

    it("records the response at the booking's own location", async () => {
      const patient = await createPatient();
      const booking = await createLocationBooking({ patient });

      expect(await submitForm(booking.id, survey.id, headaches())).toHaveSucceeded();
      const [surveyResponse] = await findPatientResponses(patient);
      expect(surveyResponse.encounter.locationId).toEqual(location.id);
      expect(surveyResponse.encounter.location.facilityId).toEqual(facilityId);
    });

    it('records the response at a location in the booked clinic', async () => {
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

      expect(await submitForm(appointment.id, survey.id, headaches())).toHaveSucceeded();
      const [surveyResponse] = await findPatientResponses(patient);
      expect(surveyResponse.encounter.locationId).toEqual(clinicLocation.id);
    });

    it("records the response in the clinic when the appointment's location is at another facility", async () => {
      const clinic = await models.LocationGroup.create(fake(models.LocationGroup, { facilityId }));
      const clinicLocation = await models.Location.create(
        fake(models.Location, { facilityId, locationGroupId: clinic.id }),
      );
      const otherFacilityLocation = await models.Location.create(
        fake(models.Location, { facilityId: otherFacility.id }),
      );
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentTypeWithForms.id,
        locationGroupId: clinic.id,
        locationId: otherFacilityLocation.id,
      });

      expect(await submitForm(appointment.id, survey.id, headaches())).toHaveSucceeded();
      const [surveyResponse] = await findPatientResponses(patient);
      expect(surveyResponse.encounter.locationId).toEqual(clinicLocation.id);
    });

    it("records the response at the facility's default location when the clinic has none", async () => {
      const emptyClinic = await models.LocationGroup.create(
        fake(models.LocationGroup, { facilityId }),
      );
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentTypeWithForms.id,
        locationGroupId: emptyClinic.id,
      });

      expect(await submitForm(appointment.id, survey.id, headaches())).toHaveSucceeded();
      const [surveyResponse] = await findPatientResponses(patient);
      expect(surveyResponse.encounter.locationId).toEqual(defaultLocation.id);
    });

    it('is forbidden without permission to run the kiosk', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentTypeWithForms.id,
      });
      const limitedApp = await ctx.baseApp.asRole('base');

      const result = await limitedApp
        .post(`/api/kiosk/appointments/${appointment.id}/forms/${survey.id}`)
        .send(headaches());

      expect(result).toBeForbidden();
      expect(await findPatientResponses(patient)).toHaveLength(0);
    });
  });

  describe('Checking in', () => {
    it('does not move an appointment staff have already progressed', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({ patient, status: APPOINTMENT_STATUSES.SEEN });

      expect(await checkIn(appointment.id)).toHaveRequestError();
      await appointment.reload();
      expect(appointment.status).toEqual(APPOINTMENT_STATUSES.SEEN);
    });

    it('marks the appointment arrived once every form has been submitted', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentTypeWithForms.id,
      });

      expect(await checkIn(appointment.id)).toHaveRequestError();
      await appointment.reload();
      expect(appointment.status).toEqual(APPOINTMENT_STATUSES.CONFIRMED);

      expect(
        await submitForm(appointment.id, survey.id, {
          answers: { [requiredDataElement.id]: 'Headaches' },
        }),
      ).toHaveSucceeded();
      expect(await checkIn(appointment.id)).toHaveSucceeded();
      await appointment.reload();
      expect(appointment.status).toEqual(APPOINTMENT_STATUSES.ARRIVED);
      expect(await findPatientResponses(patient)).toHaveLength(1);
    });

    it('checks in an appointment type without forms', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({ patient });

      expect(await checkIn(appointment.id)).toHaveSucceeded();
      await appointment.reload();
      expect(appointment.status).toEqual(APPOINTMENT_STATUSES.ARRIVED);
    });

    it('checks in a location booking once the forms for its booking type are submitted', async () => {
      const patient = await createPatient();
      const booking = await createLocationBooking({ patient });

      expect(await checkIn(booking.id)).toHaveRequestError();
      expect(
        await submitForm(booking.id, survey.id, {
          answers: { [requiredDataElement.id]: 'Headaches' },
        }),
      ).toHaveSucceeded();
      expect(await checkIn(booking.id)).toHaveSucceeded();
      await booking.reload();
      expect(booking.status).toEqual(APPOINTMENT_STATUSES.ARRIVED);
    });

    it('rejects a second check-in', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        status: APPOINTMENT_STATUSES.ARRIVED,
      });

      expect(await checkIn(appointment.id)).toHaveRequestError();
    });

    it('rejects an appointment at another facility', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({
        patient,
        locationGroupId: otherFacilityLocationGroup.id,
      });

      expect(await checkIn(appointment.id)).toHaveRequestError();
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

      expect(await checkIn(appointment.id)).toHaveRequestError();
      await appointment.reload();
      expect(appointment.status).toEqual(APPOINTMENT_STATUSES.CONFIRMED);
    });

    it('is unavailable when the kiosk is turned off', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({ patient });
      await setKioskSettings({ enabled: false });

      expect(await checkIn(appointment.id)).toHaveRequestError();
      await appointment.reload();
      expect(appointment.status).toEqual(APPOINTMENT_STATUSES.CONFIRMED);
    });

    it('checks in only once when two check-ins arrive together', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({ patient });

      const results = await Promise.all([checkIn(appointment.id), checkIn(appointment.id)]);

      expect(results.filter(result => result.status < 400)).toHaveLength(1);
      expect(results.filter(result => result.status >= 400)).toHaveLength(1);
    });

    it('is forbidden without permission to run the kiosk', async () => {
      const patient = await createPatient();
      const appointment = await createAppointment({ patient });
      const limitedApp = await ctx.baseApp.asRole('base');

      const result = await limitedApp.post(`/api/kiosk/appointments/${appointment.id}/checkIn`);

      expect(result).toBeForbidden();
      await appointment.reload();
      expect(appointment.status).toEqual(APPOINTMENT_STATUSES.CONFIRMED);
    });
  });

  describe('Permissions', () => {
    disableHardcodedPermissionsForSuite();

    const submitHeadaches = (agent, appointment) =>
      submitForm(
        appointment.id,
        survey.id,
        { answers: { [requiredDataElement.id]: 'Headaches' } },
        agent,
      );

    it('lets an account with only permission to run the kiosk check a patient in', async () => {
      const patient = await createPatient({ lastName: 'Kioskonly', dateOfBirth: '1979-04-04' });
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentTypeWithForms.id,
      });
      const kioskApp = await ctx.baseApp.asNewRole([['run', 'Kiosk']]);
      const facility = await models.Facility.findByPk(facilityId);

      const facilityResult = await kioskApp.get('/api/kiosk/facility');
      expect(facilityResult).toHaveSucceeded();
      expect(facilityResult.body).toEqual({ id: facility.id, name: facility.name });

      const search = await kioskApp
        .get('/api/kiosk/appointments')
        .query({ lastName: 'Kioskonly', dateOfBirth: '1979-04-04' });
      expect(search).toHaveSucceeded();
      expect(search.body.data.map(({ id }) => id)).toEqual([appointment.id]);
      expect(await kioskApp.get(`/api/kiosk/appointments/${appointment.id}`)).toHaveSucceeded();
      expect(await submitHeadaches(kioskApp, appointment)).toHaveSucceeded();
      expect(await checkIn(appointment.id, kioskApp)).toHaveSucceeded();

      await appointment.reload();
      expect(appointment.status).toEqual(APPOINTMENT_STATUSES.ARRIVED);
      expect(await findPatientResponses(patient)).toHaveLength(1);
    });

    it('reports no facility when the kiosk is turned off', async () => {
      await setKioskSettings({ enabled: false });
      const kioskApp = await ctx.baseApp.asNewRole([['run', 'Kiosk']]);
      expect(await kioskApp.get('/api/kiosk/facility')).toHaveRequestError();
    });

    it('gives an account with only permission to run the kiosk no access to patients elsewhere', async () => {
      const patient = await createPatient();
      const kioskApp = await ctx.baseApp.asNewRole([['run', 'Kiosk']]);

      expect(await kioskApp.get(`/api/patient/${patient.id}`)).toBeForbidden();
      expect(await kioskApp.get('/api/patient')).toBeForbidden();
    });

    it('lets an account with only permission to run the kiosk search what patients may search', async () => {
      const village = await models.ReferenceData.create(
        fake(models.ReferenceData, { type: 'village', name: 'Kioskvale' }),
      );
      const kioskApp = await ctx.baseApp.asNewRole([['run', 'Kiosk']]);

      const search = await kioskApp.get('/api/kiosk/suggestions/village').query({ q: 'Kioskv' });
      expect(search).toHaveSucceeded();
      expect(search.body.map(({ id }) => id)).toEqual([village.id]);

      const lookup = await kioskApp.get(`/api/kiosk/suggestions/village/${village.id}`);
      expect(lookup).toHaveSucceeded();
      expect(lookup.body).toMatchObject({ id: village.id, name: 'Kioskvale' });
    });

    it('offers a kiosk account no other suggestions, and no way to create them', async () => {
      const kioskApp = await ctx.baseApp.asNewRole([['run', 'Kiosk']]);

      expect(await kioskApp.get('/api/kiosk/suggestions/patient').query({ q: 'a' })).toHaveStatus(
        404,
      );
      expect(await kioskApp.get('/api/kiosk/suggestions/practitioner')).toHaveStatus(404);
      expect(
        await kioskApp.post('/api/kiosk/suggestions/village/create').send({ name: 'Newvale' }),
      ).toHaveStatus(404);
    });

    it('refuses suggestions to an account that cannot run the kiosk', async () => {
      const staffApp = await ctx.baseApp.asNewRole([['list', 'ReferenceData']]);
      expect(await staffApp.get('/api/kiosk/suggestions/village')).toBeForbidden();
    });

    it('refuses an account that can read patients and appointments but not run the kiosk', async () => {
      const patient = await createPatient({ lastName: 'Nokiosk', dateOfBirth: '1979-05-05' });
      const appointment = await createAppointment({
        patient,
        appointmentTypeId: appointmentTypeWithForms.id,
      });
      const staffApp = await ctx.baseApp.asNewRole([
        ['read', 'Appointment'],
        ['write', 'Appointment'],
        ['read', 'Patient'],
        ['read', 'Survey'],
        ['create', 'SurveyResponse'],
      ]);

      expect(
        await staffApp
          .get('/api/kiosk/appointments')
          .query({ lastName: 'Nokiosk', dateOfBirth: '1979-05-05' }),
      ).toBeForbidden();
      expect(await staffApp.get('/api/kiosk/facility')).toBeForbidden();
      expect(await staffApp.get(`/api/kiosk/appointments/${appointment.id}`)).toBeForbidden();
      expect(await submitHeadaches(staffApp, appointment)).toBeForbidden();
      expect(await checkIn(appointment.id, staffApp)).toBeForbidden();

      await appointment.reload();
      expect(appointment.status).toEqual(APPOINTMENT_STATUSES.CONFIRMED);
      expect(await findPatientResponses(patient)).toHaveLength(0);
    });
  });
});
