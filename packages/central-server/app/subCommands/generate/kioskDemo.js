// spec: KIOSK
import crypto from 'node:crypto';

import { Command } from 'commander';

import {
  APPOINTMENT_STATUSES,
  PROGRAM_DATA_ELEMENT_TYPES,
  REFERENCE_TYPES,
  SETTINGS_SCOPES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { getPrimaryTimeZone } from '@tamanu/shared/utils/timeZoneCheck';
import { getCurrentDateStringInTimezone, toStoredDateTime } from '@tamanu/utils/dateTime';

import { closeDatabase, initDatabase } from '../../database';

const ALLOW_FAKE_DATA = 'TAMANU_ALLOW_FAKE_DATA';

const T = PROGRAM_DATA_ELEMENT_TYPES;

const APPOINTMENT_TYPES = {
  consultation: { id: 'appointmentType-kioskDemoConsultation', name: 'General consultation' },
  followUp: { id: 'appointmentType-kioskDemoFollowUp', name: 'Follow-up' },
};

const BOOKING_TYPES = {
  dressing: { id: 'bookingType-kioskDemoDressing', name: 'Wound dressing' },
};

/**
 * The demo forms. Each question is `[code, type, text, options]`; a question's page is its
 * position in `pages`. Codes are prefixed so they can't collide with real programs.
 */
const FORMS = [
  {
    key: 'contactDetails',
    name: 'Contact details',
    pages: [
      [
        {
          code: 'Phone',
          type: T.PATIENT_DATA,
          text: 'Mobile phone number',
          config: { column: 'primaryContactNumber' },
        },
        { code: 'Email', type: T.TEXT, text: 'Email address' },
        {
          code: 'Village',
          type: T.AUTOCOMPLETE,
          text: 'Which village do you live in?',
          config: { source: 'ReferenceData', where: { type: 'village' } },
        },
        { code: 'EmergencyName', type: T.TEXT, text: 'Emergency contact name', mandatory: true },
        {
          code: 'EmergencyPhone',
          type: T.TEXT,
          text: 'Emergency contact phone number',
          mandatory: true,
        },
        {
          code: 'EmergencyRelationship',
          type: T.SELECT,
          text: 'How is this person related to you?',
          options: ['Spouse or partner', 'Parent', 'Child', 'Sibling', 'Friend', 'Other'],
          mandatory: true,
        },
      ],
      [
        {
          code: 'Travel',
          type: T.RADIO,
          text: 'How did you travel here today?',
          options: ['Walked', 'Bus', 'Car or taxi', 'Other'],
        },
        {
          code: 'InterpreterNeeded',
          type: T.BINARY,
          text: 'Would you like an interpreter for your visit?',
        },
      ],
    ],
  },
  {
    key: 'healthQuestions',
    name: 'Health questions',
    pages: [
      [
        {
          code: 'Intro',
          type: T.INSTRUCTION,
          text: 'The next questions are about how you are feeling today. Your answers help the clinician prepare for your visit.',
        },
        {
          code: 'Reason',
          type: T.TEXT,
          text: 'What is the main reason for your visit?',
          mandatory: true,
        },
      ],
      [
        {
          code: 'Fever',
          type: T.BINARY,
          text: 'Do you have a fever, cough or sore throat today?',
          mandatory: true,
        },
        {
          code: 'Symptoms',
          type: T.MULTI_SELECT,
          text: 'Do you have any of these symptoms?',
          options: ['Fever', 'Cough', 'Sore throat', 'Headache', 'None of these'],
          visibility: { Fever: 'Yes' },
        },
        {
          code: 'SymptomStart',
          type: T.DATE,
          text: 'When did your symptoms start?',
          visibility: { Fever: 'Yes' },
        },
        {
          code: 'SymptomDays',
          type: T.NUMBER,
          text: 'How many days have you had these symptoms?',
          visibility: { Fever: 'Yes' },
        },
        {
          code: 'Pregnant',
          type: T.RADIO,
          text: 'Are you currently pregnant?',
          options: ['Yes', 'No', 'Not sure'],
        },
      ],
      [
        { code: 'Allergies', type: T.BINARY, text: 'Do you have any allergies?' },
        {
          code: 'AllergyDetails',
          type: T.MULTILINE,
          text: 'Please tell us about your allergies',
          visibility: { Allergies: 'Yes' },
          mandatory: true,
        },
        {
          code: 'AnythingElse',
          type: T.MULTILINE,
          text: 'Is there anything else you would like the clinician to know?',
        },
      ],
    ],
  },
  {
    key: 'consent',
    name: 'Consent',
    pages: [
      [
        {
          code: 'ConsentInfo',
          type: T.INSTRUCTION,
          text: 'We share your results with your GP so they can look after you between visits.',
        },
        {
          code: 'ConsentShare',
          type: T.CHECKBOX,
          text: 'I consent to sharing my results with my GP.',
          mandatory: true,
        },
        {
          code: 'ConsentSignature',
          type: T.SIGNATURE,
          text: 'Please sign to confirm',
        },
      ],
    ],
  },
];

const APPOINTMENT_LENGTH_MINUTES = 15;

const DEMO_PATIENTS = [
  {
    id: 'patient-kioskDemo-mele',
    displayId: 'HDGF482915',
    firstName: 'Mele',
    middleName: 'Losana',
    lastName: 'Taufa',
    dateOfBirth: '1986-03-14',
    sex: 'female',
    primaryContactNumber: '021 555 0193',
    appointment: { time: '10:30', type: 'consultation' },
  },
  {
    id: 'patient-kioskDemo-viliami',
    displayId: 'KLMN739204',
    firstName: 'Viliami',
    lastName: 'Taufa',
    dateOfBirth: '1986-03-14',
    sex: 'male',
    appointment: { time: '14:15', type: 'consultation' },
  },
  {
    id: 'patient-kioskDemo-sione',
    displayId: 'PQRS118273',
    firstName: 'Sione',
    lastName: 'Fonoti',
    dateOfBirth: '1971-07-07',
    sex: 'male',
    primaryContactNumber: '022 555 0110',
    appointment: { time: '11:00', type: 'consultation' },
  },
  {
    id: 'patient-kioskDemo-grace',
    displayId: 'TUVW552901',
    firstName: 'Grace',
    lastName: 'Tupou',
    dateOfBirth: '1955-11-02',
    sex: 'female',
    appointment: { time: '09:45', type: 'followUp' },
  },
  {
    id: 'patient-kioskDemo-ana',
    displayId: 'XYZA640318',
    firstName: 'Ana',
    lastName: 'Lealaiauloto',
    dateOfBirth: '1990-01-01',
    sex: 'female',
    appointment: { time: '09:00', type: 'followUp', status: APPOINTMENT_STATUSES.ARRIVED },
  },
  {
    id: 'patient-kioskDemo-losa',
    displayId: 'BCDE905127',
    firstName: 'Losa',
    lastName: 'Vaai',
    dateOfBirth: '1968-09-21',
    sex: 'female',
    appointment: { time: '13:30', bookingType: 'dressing' },
  },
];

const PROGRAM_ID = 'program-kioskDemo';
const surveyIdOf = form => `program-kioskDemo-${form.key}`;

const upsert = async (Model, values) => {
  const [record] = await Model.upsert(values, { returning: true });
  return record;
};

const seedForms = async models => {
  await upsert(models.Program, { id: PROGRAM_ID, code: 'kioskDemo', name: 'Self check-in' });
  for (const form of FORMS) {
    await upsert(models.Survey, {
      id: surveyIdOf(form),
      code: `kioskDemo-${form.key}`,
      name: form.name,
      programId: PROGRAM_ID,
      surveyType: 'programs',
      isSensitive: false,
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    });
  }
  for (const form of FORMS) {
    const surveyId = surveyIdOf(form);
    for (const [screenIndex, questions] of form.pages.entries()) {
      for (const [componentIndex, question] of questions.entries()) {
        const code = `kioskDemo${question.code}`;
        const dataElementId = `pde-${code}`;
        await upsert(models.ProgramDataElement, {
          id: dataElementId,
          code,
          name: question.text,
          defaultText: question.text,
          type: question.type,
          defaultOptions: question.options ? JSON.stringify(question.options) : null,
        });
        const visibility = question.visibility
          ? Object.fromEntries(
              Object.entries(question.visibility).map(([dependency, answer]) => [
                `kioskDemo${dependency}`,
                answer,
              ]),
            )
          : null;
        await upsert(models.SurveyScreenComponent, {
          id: `${surveyId}-${code}`,
          surveyId,
          dataElementId,
          screenIndex,
          componentIndex,
          text: question.text,
          options: question.options ? JSON.stringify(question.options) : null,
          visibilityCriteria: visibility ? JSON.stringify(visibility) : '',
          validationCriteria: JSON.stringify({ mandatory: Boolean(question.mandatory) }),
          config: question.config ? JSON.stringify(question.config) : '',
          calculation: '',
          visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        });
      }
    }
  }
  return FORMS.map(surveyIdOf);
};

const findOrCreateClinic = async (models, facilityId) => {
  const existingGroup = await models.LocationGroup.findOne({
    where: { facilityId, visibilityStatus: VISIBILITY_STATUSES.CURRENT },
    order: [['name', 'ASC']],
  });
  if (existingGroup) return existingGroup;
  return upsert(models.LocationGroup, {
    id: `locationGroup-kioskDemo-${facilityId}`,
    code: `kioskDemoClinic-${facilityId}`,
    name: 'Outpatient clinic',
    facilityId,
  });
};

const findOrCreateRoom = async (models, facilityId) => {
  const existingLocation = await models.Location.findOne({
    where: { facilityId, visibilityStatus: VISIBILITY_STATUSES.CURRENT },
    order: [['name', 'ASC']],
  });
  if (existingLocation) return existingLocation;
  return upsert(models.Location, {
    id: `location-kioskDemo-${facilityId}`,
    code: `kioskDemoRoom-${facilityId}`,
    name: 'Treatment room',
    facilityId,
  });
};

const findOrCreateClinician = async models => {
  const email = 'kiosk.demo.clinician@tamanu.io';
  const existing = await models.User.findOne({ where: { email } });
  if (existing) return existing;
  return models.User.create({
    email,
    displayName: 'Dr Sione Lee',
    role: 'practitioner',
    // Nobody signs in as this clinician; they exist so appointments name someone
    password: crypto.randomUUID(),
  });
};

export const generateKioskDemo = async ({ facility: facilityId }) => {
  // Fail closed: this writes fake patients and appointments into the database it runs against
  if (process.env[ALLOW_FAKE_DATA] !== 'true') {
    throw new Error(
      `generate kioskDemo writes fake clinical data, so it runs only with ${ALLOW_FAKE_DATA}=true`,
    );
  }

  const store = await initDatabase({ testMode: false });
  const { models, sequelize } = store;
  try {
    const facility = await models.Facility.findByPk(facilityId);
    if (!facility) throw new Error(`No facility with ID ${facilityId}`);

    await sequelize.transaction(async () => {
      for (const { id, name } of Object.values(APPOINTMENT_TYPES)) {
        await upsert(models.ReferenceData, {
          id,
          code: id.replace('appointmentType-', ''),
          name,
          type: REFERENCE_TYPES.APPOINTMENT_TYPE,
          visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        });
      }
      for (const { id, name } of Object.values(BOOKING_TYPES)) {
        await upsert(models.ReferenceData, {
          id,
          code: id.replace('bookingType-', ''),
          name,
          type: REFERENCE_TYPES.BOOKING_TYPE,
          visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        });
      }

      const surveyIds = await seedForms(models);
      const clinic = await findOrCreateClinic(models, facilityId);
      const room = await findOrCreateRoom(models, facilityId);
      const clinician = await findOrCreateClinician(models);

      const primaryTimeZone = getPrimaryTimeZone();
      const facilityTimeZone = await models.Setting.get('facilityTimeZone', facilityId);
      const today = getCurrentDateStringInTimezone(facilityTimeZone ?? primaryTimeZone);
      const atToday = time =>
        toStoredDateTime(`${today}T${time}:00`, primaryTimeZone, facilityTimeZone);

      for (const { appointment, primaryContactNumber, ...patient } of DEMO_PATIENTS) {
        await upsert(models.Patient, { ...patient, visibilityStatus: VISIBILITY_STATUSES.CURRENT });
        if (primaryContactNumber) {
          await upsert(models.PatientAdditionalData, {
            patientId: patient.id,
            primaryContactNumber,
          });
        }
        await models.PatientFacility.findOrCreate({
          where: { patientId: patient.id, facilityId },
        });
        const [hours, minutes] = appointment.time.split(':').map(Number);
        const endMinutes = hours * 60 + minutes + APPOINTMENT_LENGTH_MINUTES;
        const endTime = [Math.floor(endMinutes / 60), endMinutes % 60]
          .map(part => String(part).padStart(2, '0'))
          .join(':');
        await upsert(models.Appointment, {
          id: `appointment-kioskDemo-${patient.id.replace('patient-kioskDemo-', '')}`,
          patientId: patient.id,
          clinicianId: clinician.id,
          ...(appointment.bookingType
            ? {
                locationGroupId: null,
                locationId: room.id,
                appointmentTypeId: null,
                bookingTypeId: BOOKING_TYPES[appointment.bookingType].id,
              }
            : {
                locationGroupId: clinic.id,
                locationId: null,
                appointmentTypeId: APPOINTMENT_TYPES[appointment.type].id,
                bookingTypeId: null,
              }),
          startTime: atToday(appointment.time),
          endTime: atToday(endTime),
          status: appointment.status ?? APPOINTMENT_STATUSES.CONFIRMED,
          deletedAt: null,
        });
      }

      await models.Setting.set(
        'kiosk',
        {
          enabled: true,
          forms: [
            { appointmentTypeId: APPOINTMENT_TYPES.consultation.id, surveyIds },
            { appointmentTypeId: APPOINTMENT_TYPES.followUp.id, surveyIds: [surveyIds[1]] },
            { bookingTypeId: BOOKING_TYPES.dressing.id, surveyIds: [surveyIds[1]] },
          ],
        },
        SETTINGS_SCOPES.FACILITY,
        facilityId,
      );
    });

    log.info(`Kiosk demo ready at ${facility.name}`, {
      patients: DEMO_PATIENTS.map(
        ({ lastName, dateOfBirth, appointment }) =>
          `${lastName} ${dateOfBirth} (${appointment.type ?? appointment.bookingType}, ${appointment.time})`,
      ),
    });
  } finally {
    await closeDatabase();
  }
};

export const kioskDemoCommand = new Command('kioskDemo')
  .description(
    'Set up the self check-in kiosk demo at a facility: forms, patients, and appointments today',
  )
  .requiredOption('-f, --facility <id>', 'facility to run the kiosk at')
  .action(generateKioskDemo);
