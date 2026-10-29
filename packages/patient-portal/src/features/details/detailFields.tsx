import React from 'react';
import { REFERENCE_TYPES, SEX_LABELS, TITLE_LABELS } from '@tamanu/constants';
import { TranslatedEnum, TranslatedText } from '@tamanu/ui-components';
import type { PatientWithAdditionalData } from '@tamanu/shared/schemas/patientPortal';
import type { FieldSetting } from '@api/queries/usePortalSettingsQuery';
import { formatRecordDate } from '../record/recordList';

type Patient = PatientWithAdditionalData;

/**
 * How a detail is entered: typed (`text`, `phone`, `email`), chosen from the standard titles, or
 * chosen from a type of reference data.
 */
export type DetailInput =
  | { kind: 'text' | 'phone' | 'email' }
  | { kind: 'title' }
  | { kind: 'referenceData'; type: string; relation: 'ethnicity' | 'insurer' | 'occupation' };

export interface DetailField {
  /** The field's name in the field settings, and the key the portal saves it under */
  name: string;
  label: React.ReactNode;
  /** Read-only details have no input */
  input?: DetailInput;
  getValue: (patient: Patient) => string | null | undefined;
  /** What the patient sees, where it differs from the stored value */
  getDisplayValue?: (patient: Patient) => React.ReactNode;
}

const additional = (name: keyof NonNullable<Patient['additionalData']>) => (patient: Patient) =>
  patient.additionalData?.[name] as string | null | undefined;

const fieldLabel = (name: string, fallback: string) => (
  <TranslatedText stringId={`general.localisedField.${name}.label`} fallback={fallback} />
);

const referenceDataDetail = (
  name: string,
  relation: 'ethnicity' | 'insurer' | 'occupation',
  type: string,
  fallback: string,
): DetailField => ({
  name,
  label: fieldLabel(name, fallback),
  input: { kind: 'referenceData', type, relation },
  getValue: additional(name as keyof NonNullable<Patient['additionalData']>),
  getDisplayValue: patient => patient.additionalData?.[relation]?.name,
});

const textDetail = (
  name: string,
  fallback: string,
  kind: 'text' | 'phone' | 'email' = 'text',
): DetailField => ({
  name,
  label: fieldLabel(name, fallback),
  input: { kind },
  getValue: additional(name as keyof NonNullable<Patient['additionalData']>),
});

export interface DetailGroup {
  key: string;
  title: React.ReactNode;
  fields: DetailField[];
}

/** The patient's details, grouped as they're shown and edited. */
export const DETAIL_GROUPS: DetailGroup[] = [
  {
    key: 'personal',
    title: <TranslatedText stringId="patientPortal.details.personal" fallback="Personal" />,
    fields: [
      {
        name: 'displayId',
        label: <TranslatedText stringId="patientPortal.details.patientId" fallback="Patient ID" />,
        getValue: patient => patient.displayId,
      },
      {
        name: 'title',
        label: fieldLabel('title', 'Title'),
        input: { kind: 'title' },
        getValue: additional('title'),
        getDisplayValue: patient =>
          patient.additionalData?.title && (
            <TranslatedEnum value={patient.additionalData.title} enumValues={TITLE_LABELS} />
          ),
      },
      {
        name: 'firstName',
        label: fieldLabel('firstName', 'First name'),
        getValue: patient => patient.firstName,
      },
      {
        name: 'middleName',
        label: fieldLabel('middleName', 'Middle name'),
        getValue: patient => patient.middleName,
      },
      {
        name: 'lastName',
        label: fieldLabel('lastName', 'Last name'),
        getValue: patient => patient.lastName,
      },
      {
        name: 'dateOfBirth',
        label: fieldLabel('dateOfBirth', 'Date of birth'),
        getValue: patient => patient.dateOfBirth,
        getDisplayValue: patient => formatRecordDate(patient.dateOfBirth),
      },
      {
        name: 'sex',
        label: fieldLabel('sex', 'Sex'),
        getValue: patient => patient.sex,
        getDisplayValue: patient => <TranslatedEnum value={patient.sex} enumValues={SEX_LABELS} />,
      },
      {
        name: 'villageId',
        label: fieldLabel('villageId', 'Village'),
        getValue: patient => patient.village?.id,
        getDisplayValue: patient => patient.village?.name,
      },
      referenceDataDetail('ethnicityId', 'ethnicity', REFERENCE_TYPES.ETHNICITY, 'Ethnicity'),
    ],
  },
  {
    key: 'contact',
    title: <TranslatedText stringId="patientPortal.details.contact" fallback="Contact" />,
    fields: [
      textDetail('primaryContactNumber', 'Mobile phone', 'phone'),
      textDetail('secondaryContactNumber', 'Other phone', 'phone'),
      {
        name: 'email',
        label: fieldLabel('email', 'Email'),
        input: { kind: 'email' },
        getValue: patient => patient.email,
      },
    ],
  },
  {
    key: 'address',
    title: <TranslatedText stringId="patientPortal.details.address" fallback="Address" />,
    fields: [textDetail('streetVillage', 'Street address'), textDetail('cityTown', 'Town or city')],
  },
  {
    key: 'emergencyContact',
    title: (
      <TranslatedText
        stringId="patientPortal.details.emergencyContact"
        fallback="Emergency contact"
      />
    ),
    fields: [
      textDetail('emergencyContactName', 'Name'),
      textDetail('emergencyContactNumber', 'Phone', 'phone'),
    ],
  },
  {
    key: 'insurance',
    title: <TranslatedText stringId="patientPortal.details.insurance" fallback="Insurance" />,
    fields: [
      referenceDataDetail('insurerId', 'insurer', REFERENCE_TYPES.INSURER, 'Health insurer'),
      textDetail('insurerPolicyNumber', 'Policy number'),
    ],
  },
  {
    key: 'other',
    title: <TranslatedText stringId="patientPortal.details.other" fallback="Other" />,
    fields: [
      referenceDataDetail('occupationId', 'occupation', REFERENCE_TYPES.OCCUPATION, 'Occupation'),
    ],
  },
];

/** The details always in view on the dashboard, after the patient's name. */
export const BASIC_FIELD_NAMES = ['dateOfBirth', 'sex', 'displayId'];

/** The parts of the patient's name, shown together as one detail. */
export const NAME_FIELD_NAMES = ['firstName', 'middleName', 'lastName'];

/** The group's details the deployment uses, leaving out the ones it hides. */
export const getShownFields = (
  group: DetailGroup,
  fieldSettings: Record<string, FieldSetting> = {},
) => group.fields.filter(field => !fieldSettings[field.name]?.hidden);

export const getEditableFields = (
  group: DetailGroup,
  fieldSettings: Record<string, FieldSetting> = {},
) => getShownFields(group, fieldSettings).filter(field => field.input);
