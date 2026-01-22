import * as yup from 'yup';

const yesNoUnknown = yup
  .string()
  .lowercase()
  .oneOf(['yes', 'no', 'unknown']);

const yesNo = yup
  .string()
  .lowercase()
  .oneOf(['yes', 'no']);

export const PATIENT_DEATH_PARTIAL_SCHEMA = yup.object().shape({
  clinicianId: yup.string().required(),
  timeOfDeath: yup.date().required(),
});

export const PATIENT_DEATH_FULL_SCHEMA = yup.object().shape({
  ageOfMother: yup.number().nullable(),
  antecedentCause1: yup.string().nullable(),
  antecedentCause1Interval: yup
    .number()
    .default(0)
    .nullable(),
  antecedentCause2: yup.string().nullable(),
  antecedentCause2Interval: yup
    .number()
    .default(0)
    .nullable(),
  antecedentCause3: yup.string().nullable(),
  antecedentCause3Interval: yup
    .number()
    .default(0)
    .nullable(),
  birthWeight: yup.number().nullable(),
  causeOfDeath: yup.string().required(),
  causeOfDeathInterval: yup
    .number()
    .default(0)
    .nullable(),
  clinicianId: yup.string().required(),
  deathWithin24HoursOfBirth: yesNo,
  facilityId: yup.string().nullable(),
  fetalOrInfant: yesNo.default('no'),
  lastSurgeryDate: yup.date().nullable(),
  lastSurgeryReason: yup.string().nullable(),
  mannerOfDeath: yup.string().required(),
  mannerOfDeathDate: yup.date().nullable(),
  mannerOfDeathLocation: yup.string().nullable(), // actually "external cause"
  mannerOfDeathOther: yup.string().nullable(),
  numberOfCompletedPregnancyWeeks: yup.number().nullable(),
  numberOfHoursSurvivedSinceBirth: yup.number().nullable(),
  otherContributingConditions: yup
    .array()
    .of(yup.object())
    .nullable(),
  outsideHealthFacility: yup
    .boolean()
    .default(false)
    .nullable(),
  pregnancyContribute: yesNoUnknown,
  pregnant: yesNoUnknown,
  stillborn: yesNoUnknown,
  surgeryInLast4Weeks: yesNoUnknown,
  timeOfDeath: yup.date().required(),
  autopsyRequested: yesNoUnknown,
  autopsyFindingsUsed: yesNoUnknown,
  mannerOfDeathDescription: yup.string().nullable(),
  pregnancyMoment: yup.string().nullable(),
  multiplePregnancy: yesNoUnknown,
  motherConditionDescription: yup.string().nullable(),
});
