import {
  MARTIAL_STATUS_LABELS,
  SEX_LABELS,
  BLOOD_LABELS,
  EDUCATIONAL_ATTAINMENT_LABELS,
  SOCIAL_MEDIA_LABELS,
  TITLE_LABELS,
} from './patientFields.js';
import {
  INVOICE_STATUS_LABELS,
  INVOICE_INSURER_PAYMENT_STATUS_LABELS,
  INVOICE_ITEMS_CATEGORY_LABELS,
  INVOICE_PATIENT_PAYMENT_STATUSES_LABELS,
} from './invoices.js';
import { ENCOUNTER_TYPE_LABELS } from './encounters.js';
import { NOTE_TYPE_LABELS } from './notes.js';
import {
  REFERRAL_STATUS_LABELS,
  APPOINTMENT_STATUSES,
  IMAGING_REQUEST_STATUS_LABELS,
} from './statuses.js';
import {
  VACCINE_STATUS_LABELS,
  INJECTION_SITE_LABELS,
  VACCINE_CATEGORY_LABELS,
} from './vaccines.js';
import {
  ATTENDANT_OF_BIRTH_LABELS,
  BIRTH_DELIVERY_TYPE_LABELS,
  BIRTH_TYPE_LABELS,
  PLACE_OF_BIRTH_LABELS,
} from './births.js';
import {
  REPORT_DATA_SOURCE_LABELS,
  REPORT_DEFAULT_DATE_RANGES_LABELS,
  REPORT_DB_SCHEMA_LABELS,
  REPORT_STATUS_LABELS,
} from './reports.js';
import { TEMPLATE_TYPE_LABELS } from './templates.js';
import { LAB_REQUEST_STATUS_LABELS } from './labs.js';
import { ASSET_NAME_LABELS } from './importable.js';
import { DIAGNOSIS_CERTAINTY_LABELS, PATIENT_ISSUE_LABELS } from './diagnoses.js';
import { DRUG_ROUTE_LABELS, REPEATS_LABELS } from './medications.js';
import { PLACE_OF_DEATHS, MANNER_OF_DEATHS } from './deaths.js';
import { LOCATION_AVAILABILITY_STATUS_LABELS } from './locations.js';
import { TASK_FREQUENCY_UNIT_LABELS, TASK_DURATION_UNIT_LABELS } from './tasks.js';
import { IMAGING_TYPES } from './imaging.js';
import {
  REPEAT_FREQUENCY_LABELS,
  REPEAT_FREQUENCY_UNIT_LABELS,
  REPEAT_FREQUENCY_UNIT_PLURAL_LABELS,
} from './appointments.js';
import { PROGRAM_REGISTRATION_STATUS_LABELS } from './programRegistry.js';

type EnumKeys = keyof typeof registeredEnums;
type EnumValues = (typeof registeredEnums)[EnumKeys];
type EnumEntries = [EnumKeys, EnumValues][];

/**
 * This is a group of all the enums that are registered to be translatable.
 * This allows us to keep track of changes to existing enums or the additional
 * of new enum constants when maintaining translations
 */
export const registeredEnums = {
  APPOINTMENT_STATUSES,
  ATTENDANT_OF_BIRTH_LABELS,
  ASSET_NAME_LABELS,
  BIRTH_DELIVERY_TYPE_LABELS,
  BIRTH_TYPE_LABELS,
  BLOOD_LABELS,
  DIAGNOSIS_CERTAINTY_LABELS,
  DRUG_ROUTE_LABELS,
  EDUCATIONAL_ATTAINMENT_LABELS,
  ENCOUNTER_TYPE_LABELS,
  IMAGING_TYPES,
  IMAGING_REQUEST_STATUS_LABELS,
  INJECTION_SITE_LABELS,
  INVOICE_INSURER_PAYMENT_STATUS_LABELS,
  INVOICE_ITEMS_CATEGORY_LABELS,
  INVOICE_PATIENT_PAYMENT_STATUSES_LABELS,
  INVOICE_STATUS_LABELS,
  LAB_REQUEST_STATUS_LABELS,
  LOCATION_AVAILABILITY_STATUS_LABELS,
  MANNER_OF_DEATHS,
  MARTIAL_STATUS_LABELS,
  NOTE_TYPE_LABELS,
  PATIENT_ISSUE_LABELS,
  PLACE_OF_BIRTH_LABELS,
  PLACE_OF_DEATHS,
  PROGRAM_REGISTRATION_STATUS_LABELS,
  REFERRAL_STATUS_LABELS,
  REPEATS_LABELS,
  REPEAT_FREQUENCY_LABELS,
  REPEAT_FREQUENCY_UNIT_LABELS,
  REPEAT_FREQUENCY_UNIT_PLURAL_LABELS,
  REPORT_DATA_SOURCE_LABELS,
  REPORT_DB_SCHEMA_LABELS,
  REPORT_DEFAULT_DATE_RANGES_LABELS,
  REPORT_STATUS_LABELS,
  SEX_LABELS,
  TASK_FREQUENCY_UNIT_LABELS,
  TASK_DURATION_UNIT_LABELS,
  SOCIAL_MEDIA_LABELS,
  TEMPLATE_TYPE_LABELS,
  TITLE_LABELS,
  VACCINE_CATEGORY_LABELS,
  VACCINE_STATUS_LABELS,
};

/**
 * Translation String id Prefix for each enum group
 * @example SEX_LABELS
 * // String ids will be formatted with prefix 'patient.property.sex':
 * ['patient.property.sex.male', 'patient.property.female', 'patient.property.other']
 */
export const translationPrefixes: Record<EnumKeys, string> = {
  APPOINTMENT_STATUSES: 'appointment.property.status',
  ATTENDANT_OF_BIRTH_LABELS: 'birth.property.attendantOfBirth',
  ASSET_NAME_LABELS: 'asset.property.name',
  BIRTH_DELIVERY_TYPE_LABELS: 'birth.property.birthDeliveryType',
  BIRTH_TYPE_LABELS: 'birth.property.birthType',
  BLOOD_LABELS: 'patient.property.blood',
  DIAGNOSIS_CERTAINTY_LABELS: 'diagnosis.property.certainty',
  DRUG_ROUTE_LABELS: 'medication.property.route',
  EDUCATIONAL_ATTAINMENT_LABELS: 'patient.property.educationalAttainment',
  ENCOUNTER_TYPE_LABELS: 'encounter.property.type',
  IMAGING_TYPES: 'imaging.property.type',
  IMAGING_REQUEST_STATUS_LABELS: 'imaging.property.status',
  INJECTION_SITE_LABELS: 'vaccine.property.injectionSite',
  INVOICE_INSURER_PAYMENT_STATUS_LABELS: 'invoice.property.insurerPaymentStatus',
  INVOICE_ITEMS_CATEGORY_LABELS: 'invoice.property.itemCategory',
  INVOICE_PATIENT_PAYMENT_STATUSES_LABELS: 'invoice.property.patientPaymentStatus',
  INVOICE_STATUS_LABELS: 'invoice.property.status',
  LAB_REQUEST_STATUS_LABELS: 'lab.property.status',
  LOCATION_AVAILABILITY_STATUS_LABELS: 'bedManagement.property.status',
  MANNER_OF_DEATHS: 'death.property.mannerOfDeath',
  MARTIAL_STATUS_LABELS: 'patient.property.maritalStatus',
  NOTE_TYPE_LABELS: 'note.property.type',
  PATIENT_ISSUE_LABELS: 'patient.property.issue',
  PLACE_OF_BIRTH_LABELS: 'birth.property.placeOfBirth',
  PLACE_OF_DEATHS: 'death.property.placeOfDeath',
  PROGRAM_REGISTRATION_STATUS_LABELS: 'programRegistry.property.registrationStatus',
  REFERRAL_STATUS_LABELS: 'referral.property.status',
  REPEATS_LABELS: 'medication.property.repeats',
  REPEAT_FREQUENCY_LABELS: 'scheduling.property.repeatFrequency',
  REPEAT_FREQUENCY_UNIT_LABELS: 'scheduling.property.repeatFrequencyUnit',
  REPEAT_FREQUENCY_UNIT_PLURAL_LABELS: 'scheduling.property.repeatFrequencyUnitPlural',
  REPORT_DATA_SOURCE_LABELS: 'report.property.dataSource',
  REPORT_DB_SCHEMA_LABELS: 'report.property.schema',
  REPORT_DEFAULT_DATE_RANGES_LABELS: 'report.property.defaultDateRange',
  REPORT_STATUS_LABELS: 'report.property.status',
  SEX_LABELS: 'patient.property.sex',
  TASK_FREQUENCY_UNIT_LABELS: 'task.property.frequencyUnit',
  TASK_DURATION_UNIT_LABELS: 'task.property.durationUnit',
  SOCIAL_MEDIA_LABELS: 'patient.property.socialMedia',
  TEMPLATE_TYPE_LABELS: 'template.property.type',
  TITLE_LABELS: 'patient.property.title',
  VACCINE_CATEGORY_LABELS: 'vaccine.property.category',
  VACCINE_STATUS_LABELS: 'vaccine.property.status',
};

export const enumRegistry = new Set(Object.values(registeredEnums));

/** Map holds pairs of key: enum object reference and value: translation prefix as value */
export const prefixMap = new Map(
  (Object.entries(registeredEnums) as EnumEntries).map(([key, enumValue]) => [
    enumValue,
    translationPrefixes[key],
  ]),
);

/** The list of all translatable enums string id and fallback */
export const enumTranslations = (Object.entries(registeredEnums) as EnumEntries).flatMap(
  ([key, value]) =>
    Object.entries(value).map(([enumKey, enumValue]) => [
      `${translationPrefixes[key]}.${enumKey.replace(/[^a-zA-Z0-9]+(.)/g, (_, char) =>
        char.toUpperCase(),
      )}`,
      enumValue,
    ]),
);
