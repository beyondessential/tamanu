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
const additionalDataFields = {
  identification: ['birthCertificate', 'drivingLicense', 'passport'],
  contact: [
    'primaryContactNumber',
    'secondaryContactNumber',
    'emergencyContactName',
    'emergencyContactNumber',
  ],
  personal: [
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
  other: [
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

export const additionalDataSections = [
  {
    title: (
      <TranslatedText
        stringId="patient.details.subheading.identificationInformation"
        fallback="Identification information"
      />
    ),
    fields: additionalDataFields.identification,
  },
  {
    title: (
      <TranslatedText
        stringId="patient.details.subheading.contactInformation"
        fallback="Contact information"
      />
    ),
    fields: additionalDataFields.contact,
  },
  {
    title: (
      <TranslatedText
        stringId="patient.details.subheading.personalInformation"
        fallback="Personal information"
      />
    ),
    fields: additionalDataFields.personal,
  },
  {
    title: (
      <TranslatedText
        stringId="patient.details.subheading.otherInformation"
        fallback="Other information"
      />
    ),
    fields: additionalDataFields.other,
  },
];

export const allAdditionalDataFields = Object.values(additionalDataFields).flat();

// Cambodia data layout
const CAMBODIA_ADDITIONAL_DATA_FIELDS = {
  address: ['divisionId', 'subdivisionId', 'settlementId', 'villageId', 'streetVillage'],
  contact: [
    'primaryContactNumber',
    'secondaryContactNumber',
    'emergencyContactName',
    'emergencyContactNumber',
    'medicalAreaId',
    'nursingZoneId',
  ],
  identification: [
    'birthCertificate',
    'fieldDefinition-nationalId',
    'passport',
    'fieldDefinition-idPoorCardNumber',
    'fieldDefinition-pmrsNumber',
  ],
  personal: ['countryOfBirthId', 'nationalityId'],
};


export const CAMBODIA_ADDITIONAL_DATA_SECTIONS = [
  {
    title: (
      <TranslatedText
        stringId="patient.details.subheading.currentAddress"
        fallback="Current address"
      />
    ),
    fields: CAMBODIA_ADDITIONAL_DATA_FIELDS.address,
  },
  {
    title: (
      <TranslatedText
        stringId="patient.details.subheading.contactInformation"
        fallback="Contact information"
      />
    ),
    fields: CAMBODIA_ADDITIONAL_DATA_FIELDS.contact,
  },
  {
    title: (
      <TranslatedText
        stringId="patient.details.subheading.identificationInformation"
        fallback="Identification information"
      />
    ),
    fields: CAMBODIA_ADDITIONAL_DATA_FIELDS.identification,
  },
  {
    title: (
      <TranslatedText
        stringId="patient.details.subheading.personalInformation"
        fallback="Personal information"
      />
    ),
    fields: CAMBODIA_ADDITIONAL_DATA_FIELDS.personal,
  },
];

export const ALL_CAMBODIA_ADDITIONAL_DATA_FIELDS = Object.values(CAMBODIA_ADDITIONAL_DATA_FIELDS).flat();