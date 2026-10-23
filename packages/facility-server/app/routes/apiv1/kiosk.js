// spec: KIOSK
import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op, Sequelize } from 'sequelize';
import { z } from 'zod';
import { subject } from '@casl/ability';

import {
  APPOINTMENT_STATUSES,
  PATIENT_DATA_FIELD_LOCATIONS,
  PROGRAM_DATA_ELEMENT_TYPES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { InvalidOperationError, NotFoundError } from '@tamanu/errors';
import { getDayBoundaries, getCurrentDateStringInTimezone } from '@tamanu/utils/dateTime';
import { getPrimaryTimeZone } from '@tamanu/shared/utils/timeZoneCheck';
import { getCurrentPrimaryTimeZoneDateTimeString } from '@tamanu/shared/utils/primaryDateTime';

export const kiosk = express.Router();

/** Appointments in these statuses can't be found or checked in from the kiosk. */
const UNAVAILABLE_STATUSES = [APPOINTMENT_STATUSES.CANCELLED, APPOINTMENT_STATUSES.NO_SHOW];

const MASKED_DISPLAY_ID_VISIBLE_CHARACTERS = 4;

/** Shows the start of a patient ID and hides the rest, always hiding at least one character. */
const maskDisplayId = displayId => {
  const visibleLength = Math.min(MASKED_DISPLAY_ID_VISIBLE_CHARACTERS, displayId.length - 1);
  const visible = displayId.slice(0, Math.max(visibleLength, 0));
  return visible + '*'.repeat(displayId.length - visible.length);
};

const getKioskSettings = async req => {
  if (!req.facilityId) {
    throw new InvalidOperationError('The kiosk needs a session signed in to a facility');
  }
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

/**
 * The forms a patient completes for their appointment type, or for a location booking its booking
 * type: the current surveys the setting lists for it, in the order listed. Retired or missing
 * surveys are skipped, so a stale setting can't stop patients from checking in.
 */
const getKioskSurveys = async (req, facilitySettings, { appointmentTypeId, bookingTypeId }) => {
  const formsByType = await facilitySettings.get('kiosk.forms');
  const configuredIds = [
    ...new Set(
      formsByType?.find(forms =>
        forms.bookingTypeId
          ? forms.bookingTypeId === bookingTypeId
          : forms.appointmentTypeId === appointmentTypeId,
      )?.surveyIds ?? [],
    ),
  ];
  const surveys = await req.models.Survey.findAll({
    where: { id: { [Op.in]: configuredIds }, visibilityStatus: VISIBILITY_STATUSES.CURRENT },
  });
  return configuredIds
    .map(surveyId => surveys.find(survey => survey.id === surveyId))
    .filter(Boolean);
};

/** Appointments past Confirmed have already been checked in, here or at reception. */
const isCheckedIn = appointment => appointment.status !== APPOINTMENT_STATUSES.CONFIRMED;

/** Always present so patient-data questions can compute ages and names. */
const BASE_PATIENT_FIELDS = ['id', 'firstName', 'lastName', 'dateOfBirth'];

/**
 * Only the parts of the patient's record that the forms' patient-data questions show, so the
 * tablet holds no more of the record than the patient will see.
 */
const getPatientDataForForms = async (models, patient, forms) => {
  const columns = forms.flatMap(({ components }) =>
    components
      .filter(({ dataElement }) => dataElement?.type === PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA)
      .map(({ config }) => {
        try {
          return JSON.parse(config || '{}').column ?? 'fullName';
        } catch {
          return null;
        }
      })
      .filter(Boolean),
  );
  const fieldsIn = modelName =>
    columns
      .map(column => PATIENT_DATA_FIELD_LOCATIONS[column])
      .filter(location => location?.[0] === modelName)
      .map(([, fieldName]) => fieldName);
  // Questions drawing on a program registry are left out of patient-facing forms, so nothing
  // here reads PatientProgramRegistration; see toPatientForm
  const customFieldIds = columns.filter(column => !(column in PATIENT_DATA_FIELD_LOCATIONS));

  const pick = (record, fields) =>
    Object.fromEntries(fields.map(field => [field, record?.[field] ?? null]));
  const additionalDataFields = fieldsIn('PatientAdditionalData');
  const additionalData =
    additionalDataFields.length > 0
      ? await models.PatientAdditionalData.findOne({ where: { patientId: patient.id } })
      : null;
  const fieldValues =
    customFieldIds.length > 0
      ? await models.PatientFieldValue.findAll({
          where: { patientId: patient.id, definitionId: { [Op.in]: customFieldIds } },
        })
      : [];

  return {
    patient: {
      ...pick(patient, [...BASE_PATIENT_FIELDS, ...fieldsIn('Patient')]),
      fieldValues: fieldValues.map(({ definitionId, value }) => ({ definitionId, value })),
    },
    patientAdditionalData: additionalData ? pick(additionalData, additionalDataFields) : null,
  };
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

/**
 * Records who viewed which patient. The tablet is signed in with a staff account, so the audit
 * trail is what answers for the patient records the kiosk put on screen.
 */
const auditPatientAccess = async (req, patients) => {
  for (const patient of patients) {
    await req.audit.access({
      recordId: patient.id,
      frontEndContext: req.params,
      model: req.models.Patient,
      facilityId: req.facilityId,
    });
  }
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

    // When the matches are different patients, each learns as little as possible about the
    // others: no clinician, and only the start of the patient ID. One patient with two
    // appointments today is choosing between their own, so nothing is hidden from them.
    const isSeveralPatients = new Set(appointments.map(({ patientId }) => patientId)).size > 1;
    await auditPatientAccess(
      req,
      appointments.map(({ patient }) => patient),
    );
    res.send({
      isSeveralPatients,
      data: appointments.map(appointment =>
        toAppointmentSummary(appointment, { isMasked: isSeveralPatients }),
      ),
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
    const { models } = req;

    const surveys = await getKioskSurveys(req, facilitySettings, appointment);
    const components = await models.SurveyScreenComponent.getComponentsForSurveys(
      surveys.map(({ id }) => id),
    );
    const forms = surveys.map(survey => ({
      ...survey.forResponse(),
      components: components.filter(({ surveyId }) => surveyId === survey.id),
    }));

    await auditPatientAccess(req, [appointment.patient]);
    res.send({
      appointment: toAppointmentSummary(appointment, { isMasked: false }),
      ...(await getPatientDataForForms(models, appointment.patient, forms)),
      forms,
    });
  }),
);

/**
 * Where the patient's form responses are recorded: the appointment's own location, or one in
 * its clinic, falling back to the facility's default form location and department.
 */
const getResponsePlace = async (req, facilitySettings, appointment) => {
  const { models, facilityId } = req;
  const getDefaultId = type => models.SurveyResponseAnswer.getDefaultId(type, facilitySettings);
  const clinicLocation =
    appointment.locationGroupId &&
    (await models.Location.findOne({
      where: {
        locationGroupId: appointment.locationGroupId,
        facilityId,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      },
      order: [['name', 'ASC']],
    }));
  return {
    locationId: appointment.locationId ?? clinicLocation?.id ?? (await getDefaultId('location')),
    departmentId: await getDefaultId('department'),
  };
};

/** An ISO 9075 datetime, as the tablet records it in the primary time zone. */
const storedDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

const checkInBodySchema = z.object({
  responses: z.array(
    z.object({
      surveyId: z.string(),
      answers: z.record(z.string(), z.unknown()),
      // How long the patient spent on the form, which the tablet holds until they check in
      startTime: storedDateTime.nullish(),
      endTime: storedDateTime.nullish(),
    }),
  ),
});

kiosk.post(
  '/appointments/:id/checkIn',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Appointment');
    req.checkPermission('write', 'Appointment');
    req.checkPermission('read', 'Patient');
    const facilitySettings = await getKioskSettings(req);
    const { responses } = await checkInBodySchema.parseAsync(req.body);
    const { models, facilityId } = req;

    const result = await req.db.transaction(async () => {
      // Lock the appointment so two check-ins for it (two tablets, or a retry) can't both succeed
      await models.Appointment.findByPk(req.params.id, { lock: true });
      const appointment = await findKioskAppointment(req, facilitySettings);
      if (isCheckedIn(appointment)) {
        throw new InvalidOperationError('This appointment has already been checked in');
      }

      const configuredSurveyIds = (await getKioskSurveys(req, facilitySettings, appointment)).map(
        ({ id }) => id,
      );
      const submittedSurveyIds = responses.map(response => response.surveyId);
      const isEveryFormSubmittedOnce =
        submittedSurveyIds.length === configuredSurveyIds.length &&
        configuredSurveyIds.every(surveyId => submittedSurveyIds.includes(surveyId));
      if (!isEveryFormSubmittedOnce) {
        throw new InvalidOperationError('Every form must be completed before checking in');
      }
      for (const surveyId of submittedSurveyIds) {
        const noun = await models.Survey.getResponsePermissionCheck(surveyId);
        req.checkPermission('create', noun === 'Charting' ? subject(noun, { id: surveyId }) : noun);
      }

      const now = getCurrentPrimaryTimeZoneDateTimeString();
      const { locationId, departmentId } =
        responses.length > 0 ? await getResponsePlace(req, facilitySettings, appointment) : {};

      const surveyResponses = [];
      for (const { surveyId, answers, startTime, endTime } of responses) {
        surveyResponses.push(
          await models.SurveyResponse.createWithAnswers({
            surveyId,
            answers,
            patientId: appointment.patientId,
            facilityId,
            userId: req.user.id,
            locationId,
            departmentId,
            startTime: startTime ?? now,
            endTime: endTime ?? now,
          }),
        );
      }

      await appointment.update({ status: APPOINTMENT_STATUSES.ARRIVED });
      await auditPatientAccess(req, [appointment.patient]);
      return {
        appointment: toAppointmentSummary(appointment, { isMasked: false }),
        surveyResponseIds: surveyResponses.map(surveyResponse => surveyResponse.id),
      };
    });

    res.send(result);
  }),
);
