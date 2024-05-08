import React from 'react';
import { TranslatedText } from '/components/Translations/TranslatedText';

export const bloodOptions = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'AB-', label: 'AB-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
];

export const maritalStatusOptions = [
  { value: 'Defacto', label: 'De facto' },
  { value: 'Married', label: 'Married' },
  { value: 'Single', label: 'Single' },
  { value: 'Widow', label: 'Widow' },
  { value: 'Divorced', label: 'Divorced' },
  { value: 'Separated', label: 'Separated' },
  { value: 'Unknown', label: 'Unknown' },
];

export const titleOptions = [
  { value: 'Mr', label: 'Mr' },
  { value: 'Mrs', label: 'Mrs' },
  { value: 'Ms', label: 'Ms' },
  { value: 'Miss', label: 'Miss' },
  { value: 'Dr', label: 'Dr' },
  { value: 'Sr', label: 'Sr' },
  { value: 'Sn', label: 'Sn' },
];

export const socialMediaOptions = [
  { value: 'Facebook', label: 'Facebook' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: 'Twitter', label: 'Twitter' },
  { value: 'Viber', label: 'Viber' },
  { value: 'WhatsApp', label: 'WhatsApp' },
];

export const educationalAttainmentOptions = [
  { value: 'No formal schooling', label: 'No formal schooling' },
  { value: 'Less than primary school', label: 'Less than primary school' },
  { value: 'Primary school completed', label: 'Primary school completed' },
  { value: 'Sec school completed', label: 'Sec school completed' },
  { value: 'High school completed', label: 'High school completed' },
  { value: 'University completed', label: 'University completed' },
  { value: 'Post grad completed', label: 'Post grad completed' },
];

// Generic data layout
const ADDITIONAL_DATA_FIELDS = {
  IDENTIFICATION: ['birthCertificate', 'drivingLicense', 'passport'],
  CONTACT: [
    'primaryContactNumber',
    'secondaryContactNumber',
    'emergencyContactName',
    'emergencyContactNumber',
  ],
  PERSONAL: [
    'title',
    'maritalStatus',
    'bloodType',
    'placeOfBirth',
    'countryOfBirthId',
    'nationalityId',
    'ethnicityId',
    'religionId',
    'educationalLevel',
    'occupationId',
    'socialMedia',
    'patientBillingTypeId',
  ],
  OTHER: [
    'streetVillage',
    'cityTown',
    'subdivisionId',
    'divisionId',
    'countryId',
    'settlementId',
    'medicalAreaId',
    'nursingZoneId',
  ],
};

export const ADDITIONAL_DATA_SECTIONS = [
  {
    title: (
      <TranslatedText
        stringId="patient.details.subheading.identificationInformation"
        fallback="Identification information"
      />
    ),
    fields: ADDITIONAL_DATA_FIELDS.IDENTIFICATION,
  },
  {
    title: (
      <TranslatedText
        stringId="patient.details.subheading.contactInformation"
        fallback="Contact information"
      />
    ),
    fields: ADDITIONAL_DATA_FIELDS.CONTACT,
  },
  {
    title: (
      <TranslatedText
        stringId="patient.details.subheading.personalInformation"
        fallback="Personal information"
      />
    ),
    fields: ADDITIONAL_DATA_FIELDS.PERSONAL,
  },
  {
    title: (
      <TranslatedText
        stringId="patient.details.subheading.otherInformation"
        fallback="Other information"
      />
    ),
    fields: ADDITIONAL_DATA_FIELDS.OTHER,
  },
];

export const ALL_ADDITIONAL_DATA_FIELDS = Object.values(ADDITIONAL_DATA_FIELDS).flat();

// Cambodia data layout
const CAMBODIA_ADDITIONAL_DATA_FIELDS = {
  ADDRESS: ['divisionId', 'subdivisionId', 'settlementId', 'villageId', 'streetVillage'],
  CONTACT: [
    'primaryContactNumber',
    'secondaryContactNumber',
    'emergencyContactName',
    'emergencyContactNumber',
    'medicalAreaId',
    'nursingZoneId',
  ],
  IDENTIFICATION: [
    'birthCertificate',
    'fieldDefinition-nationalId',
    'passport',
    'fieldDefinition-idPoorCardNumber',
    'fieldDefinition-pmrsNumber',
  ],
  PERSONAL: ['countryOfBirthId', 'nationalityId'],
};


export const CAMBODIA_ADDITIONAL_DATA_SECTIONS = [
  {
    title: (
      <TranslatedText
        stringId="patient.details.subheading.currentAddress"
        fallback="Current address"
      />
    ),
    fields: CAMBODIA_ADDITIONAL_DATA_FIELDS.ADDRESS,
  },
  {
    title: (
      <TranslatedText
        stringId="patient.details.subheading.contactInformation"
        fallback="Contact information"
      />
    ),
    fields: CAMBODIA_ADDITIONAL_DATA_FIELDS.CONTACT,
  },
  {
    title: (
      <TranslatedText
        stringId="patient.details.subheading.identificationInformation"
        fallback="Identification information"
      />
    ),
    fields: CAMBODIA_ADDITIONAL_DATA_FIELDS.IDENTIFICATION,
  },
  {
    title: (
      <TranslatedText
        stringId="patient.details.subheading.personalInformation"
        fallback="Personal information"
      />
    ),
    fields: CAMBODIA_ADDITIONAL_DATA_FIELDS.PERSONAL,
  },
];