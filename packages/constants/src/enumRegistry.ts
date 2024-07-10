import { camelCase } from 'lodash';
import { SEX_LABELS } from './patientFields';
import {
  INVOICE_LINE_TYPE_LABELS,
  INVOICE_PAYMENT_STATUS_LABELS,
  INVOICE_PRICE_CHANGE_TYPE_LABELS,
  INVOICE_STATUS_LABELS,
} from './invoices';
import { NOTE_TYPE_LABELS } from './notes';
import {
  REFERRAL_STATUS_LABELS,
  APPOINTMENT_TYPES,
  APPOINTMENT_STATUSES,
  IMAGING_REQUEST_STATUS_LABELS,
} from './statuses';
import { VACCINE_STATUS_LABELS, INJECTION_SITE_LABELS, VACCINE_CATEGORIES } from './vaccines';
import { BIRTH_TYPE_LABELS } from './births';
import { IMAGING_TYPES } from './imaging';
import {
  REPORT_DATA_SOURCE_LABELS,
  REPORT_DATE_RANGE_LABELS,
  REPORT_DB_SCHEMA_LABELS,
} from './reports';
import { TEMPLATE_TYPE_LABELS } from './templates';
import { LAB_REQUEST_STATUS_LABELS } from './labs';
import { ASSET_NAMES } from './importable';
import { DIAGNOSIS_CERTAINTY_LABELS, PATIENT_ISSUE_LABELS } from './diagnoses';
import { DRUG_ROUTE_LABELS, REPEATS_LABELS } from './medications';
import { PLACE_OF_DEATHS, MANNER_OF_DEATHS } from './deaths';
import { LOCATION_AVAILABILITY_STATUS_LABELS } from './locations';

type EnumKeys = keyof typeof registeredEnums;
type EnumValues = typeof registeredEnums[EnumKeys];
type EnumEntries = [EnumKeys, EnumValues][];

/** This is a group of all the enums that are registered to be translatable.
 * This allows us to keep track of changes to existing enums or the additional
 * of new enum constants when maintaining translations
 */
export const registeredEnums = {
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES,
  ASSET_NAMES,
  BIRTH_TYPE_LABELS,
  DIAGNOSIS_CERTAINTY_LABELS,
  DRUG_ROUTE_LABELS,
  IMAGING_REQUEST_STATUS_LABELS,
  IMAGING_TYPES,
  INJECTION_SITE_LABELS,
  INVOICE_LINE_TYPE_LABELS,
  INVOICE_PAYMENT_STATUS_LABELS,
  INVOICE_PRICE_CHANGE_TYPE_LABELS,
  INVOICE_STATUS_LABELS,
  LAB_REQUEST_STATUS_LABELS,
  LOCATION_AVAILABILITY_STATUS_LABELS,
  NOTE_TYPE_LABELS,
  PATIENT_ISSUE_LABELS,
  PLACE_OF_DEATHS,
  MANNER_OF_DEATHS,
  REFERRAL_STATUS_LABELS,
  REPEATS_LABELS,
  REPORT_DATA_SOURCE_LABELS,
  REPORT_DATE_RANGE_LABELS,
  REPORT_DB_SCHEMA_LABELS,
  SEX_LABELS,
  TEMPLATE_TYPE_LABELS,
  VACCINE_CATEGORIES,
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
  APPOINTMENT_TYPES: 'appointment.property.types',
  ASSET_NAMES: 'asset.property.name',
  BIRTH_TYPE_LABELS: 'birth.property.birthDeliveryType',
  DIAGNOSIS_CERTAINTY_LABELS: 'diagnosis.property.certainty',
  DRUG_ROUTE_LABELS: 'medication.property.route',
  IMAGING_REQUEST_STATUS_LABELS: 'imaging.property.status',
  IMAGING_TYPES: 'imaging.property.type',
  INJECTION_SITE_LABELS: 'vaccine.property.injectionSite',
  INVOICE_LINE_TYPE_LABELS: 'invoice.property.lineType',
  INVOICE_PAYMENT_STATUS_LABELS: 'invoice.property.paymentStatus',
  INVOICE_PRICE_CHANGE_TYPE_LABELS: 'invoice.property.priceChangeType',
  INVOICE_STATUS_LABELS: 'invoice.property.status',
  LAB_REQUEST_STATUS_LABELS: 'lab.property.status',
  LOCATION_AVAILABILITY_STATUS_LABELS: 'bedManagement.property.status',
  NOTE_TYPE_LABELS: 'note.property.type',
  PATIENT_ISSUE_LABELS: 'patient.property.issue',
  PLACE_OF_DEATHS: 'death.property.placeOfDeath',
  MANNER_OF_DEATHS: 'death.property.mannerOfDeath',
  REFERRAL_STATUS_LABELS: 'referral.property.status',
  REPEATS_LABELS: 'medication.property.repeats',
  REPORT_DATA_SOURCE_LABELS: 'report.property.dataSource',
  REPORT_DATE_RANGE_LABELS: 'report.property.defaultDateRange',
  REPORT_DB_SCHEMA_LABELS: 'report.property.schema',
  SEX_LABELS: 'patient.property.sex',
  TEMPLATE_TYPE_LABELS: 'template.property.type',
  VACCINE_CATEGORIES: 'vaccine.property.category',
  VACCINE_STATUS_LABELS: 'vaccine.property.status',
};

const enumRegistry = new Set(Object.values(registeredEnums));

// Map enum value references to their translation prefix
const prefixMap = new Map(
  (Object.entries(registeredEnums) as EnumEntries).map(([key, enumValue]) => [
    enumValue,
    translationPrefixes[key],
  ]),
);

/**
 * Used to enforce usage of translatable enums
 * recognises registered enums from object references
 */
export const isRegisteredEnum = (enumValues: any): boolean => enumRegistry.has(enumValues);

/** Get the translation prefix from an object reference to a registered enum */
export const getEnumPrefix = (enumValues: any): string | undefined => prefixMap.get(enumValues);

/**
 * The list of all translatable enums string id and fallback
 */
export const enumTranslations = (Object.entries(
  registeredEnums,
) as EnumEntries).flatMap(([key, value]) =>
  Object.entries(value).map(([enumKey, enumValue]) => [
    `${translationPrefixes[key]}.${camelCase(enumKey)}`,
    enumValue,
  ]),
);
