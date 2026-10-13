// spec: KIOSK
import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op, Sequelize } from 'sequelize';
import { z } from 'zod';
import { subject } from '@casl/ability';

import { APPOINTMENT_STATUSES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { InvalidOperationError, NotFoundError } from '@tamanu/errors';
import { getDayBoundaries, getCurrentDateStringInTimezone } from '@tamanu/utils/dateTime';
import { getPrimaryTimeZone } from '@tamanu/shared/utils/timeZoneCheck';
import { getCurrentPrimaryTimeZoneDateTimeString } from '@tamanu/shared/utils/primaryDateTime';

export const kiosk = express.Router();

/** Appointments in these statuses can't be found or checked in from the kiosk. */
const UNAVAILABLE_STATUSES = [APPOINTMENT_STATUSES.CANCELLED, APPOINTMENT_STATUSES.NO_SHOW];

const MASKED_DISPLAY_ID_VISIBLE_CHARACTERS = 4;

const maskDisplayId = displayId =>
  displayId.slice(0, MASKED_DISPLAY_ID_VISIBLE_CHARACTERS) +
  '*'.repeat(Math.max(displayId.length - MASKED_DISPLAY_ID_VISIBLE_CHARACTERS, 0));

const getKioskSettings = async req => {
  const facilitySettings = req.settings[req.facilityId];
  const isEnabled = await facilitySettings.get('kiosk.enabled');
  if (!isEnabled) {
    throw new InvalidOperationError('The self check-in kiosk is not enabled for this facility');
  }
  return facilitySettings;
};

const getTodayBoundaries = async facilitySettings => {
  const primaryTimeZone = getPrimaryTimeZone();
  const facilityTimeZone = await facilitySettings.get('facilityTimeZone');
  const today = getCurrentDateStringInTimezone(facilityTimeZone ?? primaryTimeZone);
  return getDayBoundaries(today, primaryTimeZone, facilityTimeZone);
};

/** Appointments today at the kiosk's facility that a patient can still check in to. */
const todayAtFacilityWhere = (facilityId, { start, end }) => ({
  startTime: { [Op.between]: [start, end] },
  status: { [Op.notIn]: UNAVAILABLE_STATUSES },
  [Op.or]: [
    { '$location.facility_id$': facilityId },
    { '$locationGroup.facility_id$': facilityId },
  ],
});

const findKioskAppointment = async (req, facilitySettings) => {
  const { Appointment } = req.models;
  const todayBoundaries = await getTodayBoundaries(facilitySettings);
  const appointment = await Appointment.findOne({
    where: { id: req.params.id, ...todayAtFacilityWhere(req.facilityId, todayBoundaries) },
    include: ['patient', 'clinician', 'location', 'locationGroup'],
  });
  if (!appointment) {
    throw new NotFoundError('Appointment not found');
  }
  return appointment;
};

const getConfiguredSurveyIds = async (facilitySettings, appointmentTypeId) => {
  const formsByAppointmentType = await facilitySettings.get('kiosk.formsByAppointmentType');
  const entry = formsByAppointmentType?.find(
    forms => forms.appointmentTypeId === appointmentTypeId,
  );
  return entry?.surveyIds ?? [];
};

const toAppointmentSummary = (appointment, { isMasked }) => {
  const { patient, clinician } = appointment;
  return {
    id: appointment.id,
    startTime: appointment.startTime,
    status: appointment.status,
    clinician: isMasked || !clinician ? null : { displayName: clinician.displayName },
    patient: {
      firstName: patient.firstName,
      middleName: patient.middleName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      sex: patient.sex,
      displayId: isMasked ? maskDisplayId(patient.displayId) : patient.displayId,
    },
  };
};

const findAppointmentsQuerySchema = z.object({
  lastName: z.string().trim().min(1),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

kiosk.get(
  '/appointments',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Appointment');
    req.checkPermission('read', 'Patient');
    const facilitySettings = await getKioskSettings(req);
    const { lastName, dateOfBirth } = await findAppointmentsQuerySchema.parseAsync(req.query);

    const todayBoundaries = await getTodayBoundaries(facilitySettings);
    const appointments = await req.models.Appointment.findAll({
      where: {
        ...todayAtFacilityWhere(req.facilityId, todayBoundaries),
        '$patient.date_of_birth$': dateOfBirth,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn('lower', Sequelize.fn('trim', Sequelize.col('patient.last_name'))),
            lastName.toLowerCase(),
          ),
        ],
      },
      include: ['patient', 'clinician', 'location', 'locationGroup'],
      order: [['startTime', 'ASC']],
    });

    // Several matches are different patients, so each one learns as little as possible
    // about the others: no clinician, and only the start of the patient ID.
    const isMasked = appointments.length > 1;
    res.send({
      data: appointments.map(appointment => toAppointmentSummary(appointment, { isMasked })),
    });
  }),
);

kiosk.get(
  '/appointments/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Appointment');
    req.checkPermission('read', 'Patient');
    req.checkPermission('read', 'Survey');
    const facilitySettings = await getKioskSettings(req);
    const appointment = await findKioskAppointment(req, facilitySettings);
    const { Survey, SurveyScreenComponent, PatientAdditionalData } = req.models;

    const surveyIds = await getConfiguredSurveyIds(facilitySettings, appointment.appointmentTypeId);
    const surveys = await Survey.findAll({
      where: {
        id: { [Op.in]: surveyIds },
        visibilityStatus: { [Op.ne]: VISIBILITY_STATUSES.HISTORICAL },
      },
    });
    const forms = await Promise.all(
      // Keep the order the setting lists them in
      surveyIds
        .map(surveyId => surveys.find(survey => survey.id === surveyId))
        .filter(Boolean)
        .map(async survey => ({
          ...survey.forResponse(),
          components: await SurveyScreenComponent.getComponentsForSurvey(survey.id),
        })),
    );

    const additionalData = await PatientAdditionalData.findOne({
      where: { patientId: appointment.patientId },
    });

    res.send({
      appointment: toAppointmentSummary(appointment, { isMasked: false }),
      patient: appointment.patient.forResponse(),
      patientAdditionalData: additionalData?.forResponse() ?? null,
      forms,
    });
  }),
);

const checkInBodySchema = z.object({
  responses: z.array(
    z.object({
      surveyId: z.string(),
      answers: z.record(z.string(), z.unknown()),
    }),
  ),
});

kiosk.post(
  '/appointments/:id/checkIn',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Appointment');
    const facilitySettings = await getKioskSettings(req);
    const { responses } = await checkInBodySchema.parseAsync(req.body);
    const { models, facilityId } = req;

    for (const { surveyId } of responses) {
      const noun = await models.Survey.getResponsePermissionCheck(surveyId);
      req.checkPermission('create', noun === 'Charting' ? subject(noun, { id: surveyId }) : noun);
    }

    const result = await req.db.transaction(async () => {
      const appointment = await findKioskAppointment(req, facilitySettings);
      if (appointment.status === APPOINTMENT_STATUSES.ARRIVED) {
        throw new InvalidOperationError('This appointment has already been checked in');
      }

      const configuredSurveyIds = await getConfiguredSurveyIds(
        facilitySettings,
        appointment.appointmentTypeId,
      );
      const submittedSurveyIds = responses.map(response => response.surveyId);
      const isEveryFormSubmittedOnce =
        submittedSurveyIds.length === configuredSurveyIds.length &&
        configuredSurveyIds.every(surveyId => submittedSurveyIds.includes(surveyId));
      if (!isEveryFormSubmittedOnce) {
        throw new InvalidOperationError('Every form must be completed before checking in');
      }

      const now = getCurrentPrimaryTimeZoneDateTimeString();
      const getDefaultId = async type =>
        models.SurveyResponseAnswer.getDefaultId(type, facilitySettings);
      const locationId = appointment.locationId ?? (await getDefaultId('location'));
      const departmentId = await getDefaultId('department');

      const surveyResponses = [];
      for (const { surveyId, answers } of responses) {
        surveyResponses.push(
          await models.SurveyResponse.createWithAnswers({
            surveyId,
            answers,
            patientId: appointment.patientId,
            facilityId,
            userId: req.user.id,
            locationId,
            departmentId,
            startTime: now,
            endTime: now,
          }),
        );
      }

      await appointment.update({ status: APPOINTMENT_STATUSES.ARRIVED });
      return {
        appointment: toAppointmentSummary(appointment, { isMasked: false }),
        surveyResponseIds: surveyResponses.map(surveyResponse => surveyResponse.id),
      };
    });

    res.send(result);
  }),
);
