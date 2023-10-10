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

const additionalDataFields = {
  identification: ['birthCertificate', 'drivingLicense', 'passport'],
  contact: [
    'primaryContactNumber',
    'secondaryContactNumber',
    'emergencyContactName',
    'emergencyContactNumber'
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
    'patientBillingTypeId'
  ],
  other: [
    'streetVillage',
    'cityTown',
    'subdivisionId',
    'divisionId',
    'countryId',
    'settlementId',
    'medicalAreaId',
    'nursingZoneId'
  ],
};

export const additionalDataSections = [
  { title: 'Identification information', fields: additionalDataFields.identification },
  { title: 'Contact information', fields: additionalDataFields.contact },
  { title: 'Personal information', fields: additionalDataFields.personal },
  { title: 'Other information', fields: additionalDataFields.other },
];

export const allAdditionalDataFields = Object.values(additionalDataFields).flat();
