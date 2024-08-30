import { camelCase } from 'lodash';
import { SEX_LABELS } from './patientFields';
import {
  INVOICE_ITEMS_CATEGORY_LABELS,
  INVOICE_STATUS_LABELS,
  INVOICE_PATIENT_PAYMENT_STATUSES_LABELS,
  INVOICE_INSURER_PAYMENT_STATUS_LABELS,
} from './invoices';
import { NOTE_TYPE_LABELS } from './notes';
import {
  REFERRAL_STATUS_LABELS,
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_STATUSES,
  IMAGING_REQUEST_STATUS_LABELS,
} from './statuses';
import { VACCINE_STATUS_LABELS, INJECTION_SITE_LABELS, VACCINE_CATEGORY_LABELS } from './vaccines';
import { BIRTH_DELIVERY_TYPE_LABELS, BIRTH_TYPE_LABELS } from './births';
import {
  REPORT_DATA_SOURCE_LABELS,
  REPORT_DEFAULT_DATE_RANGES_LABELS,
  REPORT_DB_SCHEMA_LABELS,
  REPORT_STATUS_LABELS,
} from './reports';
import { TEMPLATE_TYPE_LABELS } from './templates';
import { LAB_REQUEST_STATUS_LABELS } from './labs';
import { ASSET_NAME_LABELS } from './importable';
import { DIAGNOSIS_CERTAINTY_LABELS, PATIENT_ISSUE_LABELS } from './diagnoses';
import { DRUG_ROUTE_LABELS, REPEATS_LABELS } from './medications';
import { PLACE_OF_DEATHS, MANNER_OF_DEATHS } from './deaths';
import { LOCATION_AVAILABILITY_STATUS_LABELS } from './locations';

type EnumKeys = keyof typeof registeredEnums;
type EnumValues = typeof registeredEnums[EnumKeys];
type EnumEntries = [EnumKeys, EnumValues][];

/**
 * This is a group of all the enums that are registered to be translatable.
 * This allows us to keep track of changes to existing enums or the additional
 * of new enum constants when maintaining translations
 */
export const registeredEnums = {
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPE_LABELS,
  ASSET_NAME_LABELS,
  BIRTH_DELIVERY_TYPE_LABELS,
  BIRTH_TYPE_LABELS,
  DIAGNOSIS_CERTAINTY_LABELS,
  DRUG_ROUTE_LABELS,
  IMAGING_REQUEST_STATUS_LABELS,
  INJECTION_SITE_LABELS,
  INVOICE_INSURER_PAYMENT_STATUS_LABELS,
  INVOICE_ITEMS_CATEGORY_LABELS,
  INVOICE_PATIENT_PAYMENT_STATUSES_LABELS,
  INVOICE_STATUS_LABELS,
  LAB_REQUEST_STATUS_LABELS,
  LOCATION_AVAILABILITY_STATUS_LABELS,
  MANNER_OF_DEATHS,
  NOTE_TYPE_LABELS,
  PATIENT_ISSUE_LABELS,
  PLACE_OF_DEATHS,
  REFERRAL_STATUS_LABELS,
  REPEATS_LABELS,
  REPORT_DATA_SOURCE_LABELS,
  REPORT_DB_SCHEMA_LABELS,
  REPORT_DEFAULT_DATE_RANGES_LABELS,
  REPORT_STATUS_LABELS,
  SEX_LABELS,
  TEMPLATE_TYPE_LABELS,
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
  APPOINTMENT_TYPE_LABELS: 'appointment.property.types',
  ASSET_NAME_LABELS: 'asset.property.name',
  BIRTH_DELIVERY_TYPE_LABELS: 'birth.property.birthDeliveryType',
  BIRTH_TYPE_LABELS: 'birth.property.birthType',
  DIAGNOSIS_CERTAINTY_LABELS: 'diagnosis.property.certainty',
  DRUG_ROUTE_LABELS: 'medication.property.route',
  IMAGING_REQUEST_STATUS_LABELS: 'imaging.property.status',
  INJECTION_SITE_LABELS: 'vaccine.property.injectionSite',
  INVOICE_INSURER_PAYMENT_STATUS_LABELS: 'invoice.property.insurerPaymentStatus',
  INVOICE_ITEMS_CATEGORY_LABELS: 'invoice.property.itemCategory',
  INVOICE_PATIENT_PAYMENT_STATUSES_LABELS: 'invoice.property.patientPaymentStatus',
  INVOICE_STATUS_LABELS: 'invoice.property.status',
  LAB_REQUEST_STATUS_LABELS: 'lab.property.status',
  LOCATION_AVAILABILITY_STATUS_LABELS: 'bedManagement.property.status',
  MANNER_OF_DEATHS: 'death.property.mannerOfDeath',
  NOTE_TYPE_LABELS: 'note.property.type',
  PATIENT_ISSUE_LABELS: 'patient.property.issue',
  PLACE_OF_DEATHS: 'death.property.placeOfDeath',
  REFERRAL_STATUS_LABELS: 'referral.property.status',
  REPEATS_LABELS: 'medication.property.repeats',
  REPORT_DATA_SOURCE_LABELS: 'report.property.dataSource',
  REPORT_DB_SCHEMA_LABELS: 'report.property.schema',
  REPORT_DEFAULT_DATE_RANGES_LABELS: 'report.property.defaultDateRange',
  REPORT_STATUS_LABELS: 'report.property.status',
  SEX_LABELS: 'patient.property.sex',
  TEMPLATE_TYPE_LABELS: 'template.property.type',
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
export const enumTranslations = (Object.entries(
  registeredEnums,
) as EnumEntries).flatMap(([key, value]) =>
  Object.entries(value).map(([enumKey, enumValue]) => [
    `${translationPrefixes[key]}.${camelCase(enumKey)}`,
    enumValue,
  ]),
);
