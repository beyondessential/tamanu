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

export const ADDITIONAL_DATA_FIELDS = {
  BIRTH_CERTIFICATE: 'birthCertificate',
  DRIVING_LICENSE: 'drivingLicense',
  PASSPORT: 'passport',
  PRIMARY_CONTACT_NUMBER: 'primaryContactNumber',
  SECONDARY_CONTACT_NUMBER: 'secondaryContactNumber',
  SECONDARY_VILLAGE_ID: 'secondaryVillageId',
  EMERGENCY_CONTACT_NAME: 'emergencyContactName',
  EMERGENCY_CONTACT_NUMBER: 'emergencyContactNumber',
  TITLE: 'title',
  MARITAL_STATUS: 'maritalStatus',
  BLOOD_TYPE: 'bloodType',
  PLACE_OF_BIRTH: 'placeOfBirth',
  COUNTRY_OF_BIRTH_ID: 'countryOfBirthId',
  NATIONALITY_ID: 'nationalityId',
  ETHNICITY_ID: 'ethnicityId',
  RELIGION_ID: 'religionId',
  EDUCATIONAL_LEVEL: 'educationalLevel',
  OCCUPATION_ID: 'occupationId',
  SOCIAL_MEDIA: 'socialMedia',
  PATIENT_BILLING_TYPE_ID: 'patientBillingTypeId',
  STREET_VILLAGE: 'streetVillage',
  CITY_TOWN: 'cityTown',
  SUBDIVISION_ID: 'subdivisionId',
  DIVISION_ID: 'divisionId',
  COUNTRY_ID: 'countryId',
  SETTLEMENT_ID: 'settlementId',
  MEDICAL_AREA_ID: 'medicalAreaId',
  NURSING_ZONE_ID: 'nursingZoneId',
};

export const ALL_ADDITIONAL_DATA_FIELDS = Object.values(ADDITIONAL_DATA_FIELDS);
