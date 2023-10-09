import * as Yup from 'yup';

const requiredWhenConfiguredMandatory = (getBool, getString, name, baseType) => {
  return baseType.when([], {
    is: () => !!getBool(`fields.${name}.requiredPatientData`),
    then: baseType.required(`${getString(`fields.${name}.shortLabel`)} is required `),
    otherwise: baseType,
  });
};

export const getPatientDetailsValidation = (getBool, getString) => {
  return Yup.object().shape({
    firstName: Yup.string().required('First name is a required field'),
    middleName: Yup.string().nullable(),
    lastName: Yup.string().required('Last name is a required field'),
    culturalName: Yup.string().nullable(),
    dateOfBirth: Yup.date().required('Date of birth is a required field'),
    email: Yup.string().nullable(),
    sex: Yup.string().required('Sex is a required field'),
    village: Yup.string().nullable(),
    religionId: requiredWhenConfiguredMandatory(getBool, getString, 'religionId', Yup.string()),
    birthCertificate: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'birthCertificate',
      Yup.string(),
    ),
    passport: requiredWhenConfiguredMandatory(getBool, getString, 'passport', Yup.string()),
    primaryContactNumber: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'primaryContactNumber',
      Yup.number(),
    ),
    secondaryContactNumber: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'secondaryContactNumber',
      Yup.number(),
    ),
    emergencyContactName: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'emergencyContactName',
      Yup.number(),
    ),
    emergencyContactNumber: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'emergencyContactNumber',
      Yup.number(),
    ),
    title: requiredWhenConfiguredMandatory(getBool, getString, 'title', Yup.string()),
    bloodType: requiredWhenConfiguredMandatory(getBool, getString, 'bloodType', Yup.string()),
    placeOfBirth: requiredWhenConfiguredMandatory(getBool, getString, 'placeOfBirth', Yup.string()),
    countryOfBirthId: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'countryOfBirthId',
      Yup.string(),
    ),
    nationalityId: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'nationalityId',
      Yup.string(),
    ),
    ethnicityId: requiredWhenConfiguredMandatory(getBool, getString, 'ethnicityId', Yup.string()),
    patientBillingTypeId: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'patientBillingTypeId',
      Yup.string(),
    ),
    subdivisionId: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'subdivisionId',
      Yup.string(),
    ),
    divisionId: requiredWhenConfiguredMandatory(getBool, getString, 'divisionId', Yup.string()),
    countryId: requiredWhenConfiguredMandatory(getBool, getString, 'countryId', Yup.string()),
    settlementId: requiredWhenConfiguredMandatory(getBool, getString, 'settlementId', Yup.string()),
    medicalAreaId: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'medicalAreaId',
      Yup.string(),
    ),
    nursingZoneId: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'nursingZoneId',
      Yup.string(),
    ),
    streetVillage: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'streetVillage',
      Yup.string(),
    ),
    cityTown: requiredWhenConfiguredMandatory(getBool, getString, 'cityTown', Yup.string()),
    drivingLicense: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'drivingLicense',
      Yup.string(),
    ),
    maritalStatus: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'maritalStatus',
      Yup.string(),
    ),
    occupationId: requiredWhenConfiguredMandatory(getBool, getString, 'occupationId', Yup.string()),
    educationalLevel: requiredWhenConfiguredMandatory(
      getBool,
      getString,
      'educationalLevel',
      Yup.string(),
    ),
    socialMedia: requiredWhenConfiguredMandatory(getBool, getString, 'socialMedia', Yup.string()),
  });
};
