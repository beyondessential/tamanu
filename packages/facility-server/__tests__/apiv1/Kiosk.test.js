import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
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
  });

  describe('Loading forms', () => {
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
