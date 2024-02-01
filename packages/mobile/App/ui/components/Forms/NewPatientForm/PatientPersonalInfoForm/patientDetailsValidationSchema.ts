import * as Yup from 'yup';
import { GetSettings } from '~/ui/contexts/SettingContext';

const requiredWhenConfiguredMandatory = (
  getSetting: GetSettings,
  name: string,
  baseType: Yup.MixedSchema<any>,
) => {
  return baseType.when([], {
    is: () => !!getSetting<boolean>(`localisation.fields.${name}.requiredPatientData`),
    then: baseType.required(
      `${getSetting<string>(`localisation.fields.${name}.shortLabel`)} is required `,
    ),
    otherwise: baseType.nullable(),
  });
};

export const getPatientDetailsValidation = (getSetting: GetSettings) => {
  return Yup.object().shape({
    firstName: Yup.string().required('First name is a required field'),
    middleName: requiredWhenConfiguredMandatory(getSetting, 'middleName', Yup.string()),
    lastName: Yup.string().required('Last name is a required field'),
    culturalName: requiredWhenConfiguredMandatory(getSetting, 'culturalName', Yup.string()),
    dateOfBirth: Yup.date().required('Date of birth is a required field'),
    email: requiredWhenConfiguredMandatory(getSetting, 'email', Yup.string()),
    sex: Yup.string().required('Sex is a required field'),
    village: requiredWhenConfiguredMandatory(getSetting, 'village', Yup.string()),
    religionId: requiredWhenConfiguredMandatory(getSetting, 'religionId', Yup.string()),
    birthCertificate: requiredWhenConfiguredMandatory(getSetting, 'birthCertificate', Yup.string()),
    passport: requiredWhenConfiguredMandatory(getSetting, 'passport', Yup.string()),
    primaryContactNumber: requiredWhenConfiguredMandatory(
      getSetting,
      'primaryContactNumber',
      Yup.number(),
    ),
    secondaryContactNumber: requiredWhenConfiguredMandatory(
      getSetting,
      'secondaryContactNumber',
      Yup.number(),
    ),
    emergencyContactName: requiredWhenConfiguredMandatory(
      getSetting,
      'emergencyContactName',
      Yup.string(),
    ),
    emergencyContactNumber: requiredWhenConfiguredMandatory(
      getSetting,
      'emergencyContactNumber',
      Yup.number(),
    ),
    title: requiredWhenConfiguredMandatory(getSetting, 'title', Yup.string()),
    bloodType: requiredWhenConfiguredMandatory(getSetting, 'bloodType', Yup.string()),
    placeOfBirth: requiredWhenConfiguredMandatory(getSetting, 'placeOfBirth', Yup.string()),
    countryOfBirthId: requiredWhenConfiguredMandatory(getSetting, 'countryOfBirthId', Yup.string()),
    nationalityId: requiredWhenConfiguredMandatory(getSetting, 'nationalityId', Yup.string()),
    ethnicityId: requiredWhenConfiguredMandatory(getSetting, 'ethnicityId', Yup.string()),
    patientBillingTypeId: requiredWhenConfiguredMandatory(
      getSetting,
      'patientBillingTypeId',
      Yup.string(),
    ),
    subdivisionId: requiredWhenConfiguredMandatory(getSetting, 'subdivisionId', Yup.string()),
    divisionId: requiredWhenConfiguredMandatory(getSetting, 'divisionId', Yup.string()),
    countryId: requiredWhenConfiguredMandatory(getSetting, 'countryId', Yup.string()),
    settlementId: requiredWhenConfiguredMandatory(getSetting, 'settlementId', Yup.string()),
    medicalAreaId: requiredWhenConfiguredMandatory(getSetting, 'medicalAreaId', Yup.string()),
    nursingZoneId: requiredWhenConfiguredMandatory(getSetting, 'nursingZoneId', Yup.string()),
    streetVillage: requiredWhenConfiguredMandatory(getSetting, 'streetVillage', Yup.string()),
    cityTown: requiredWhenConfiguredMandatory(getSetting, 'cityTown', Yup.string()),
    drivingLicense: requiredWhenConfiguredMandatory(getSetting, 'drivingLicense', Yup.string()),
    maritalStatus: requiredWhenConfiguredMandatory(getSetting, 'maritalStatus', Yup.string()),
    occupationId: requiredWhenConfiguredMandatory(getSetting, 'occupationId', Yup.string()),
    educationalLevel: requiredWhenConfiguredMandatory(getSetting, 'educationalLevel', Yup.string()),
    socialMedia: requiredWhenConfiguredMandatory(getSetting, 'socialMedia', Yup.string()),
  });
};
