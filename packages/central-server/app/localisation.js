import config from 'config';
import * as yup from 'yup';
import { defaultsDeep } from 'lodash';
import { log } from '@tamanu/shared/services/logging';
import { IMAGING_TYPES } from '@tamanu/constants';

const UNHIDEABLE_FIELDS = [
  'markedForSync',
  'displayId',
  'firstName',
  'lastName',
  'dateOfBirth',
  'dateOfDeath',
  'age',
  'ageRange',
  'dateOfBirthFrom',
  'dateOfBirthTo',
  'dateOfBirthExact',
  'emergencyContactName',
  'emergencyContactNumber',
  'locationId',
  'locationGroupId',
  'clinician',
  'diagnosis',
  'userDisplayId',
  'date',
  'registeredBy',
  'status',
  'conditions',
  'programRegistry',
  'circumstanceIds',
  'reminderContactName',
  'reminderContactRelationship',
  'weightUnit',
];

const HIDEABLE_FIELDS = [
  'countryName',
  'culturalName',
  'sex',
  'email',
  'villageName',
  'villageId',
  'bloodType',
  'title',
  'placeOfBirth',
  'countryOfBirthId',
  'maritalStatus',
  'primaryContactNumber',
  'secondaryContactNumber',
  'socialMedia',
  'settlementId',
  'streetVillage',
  'cityTown',
  'subdivisionId',
  'divisionId',
  'countryId',
  'medicalAreaId',
  'nursingZoneId',
  'nationalityId',
  'ethnicityId',
  'occupationId',
  'educationalLevel',
  'middleName',
  'birthCertificate',
  'insurerId',
  'insurerPolicyNumber',
  'drivingLicense',
  'passport',
  'religionId',
  'patientBillingTypeId',
  'motherId',
  'fatherId',
  'birthWeight',
  'birthLength',
  'birthDeliveryType',
  'gestationalAgeEstimate',
  'apgarScoreOneMinute',
  'apgarScoreFiveMinutes',
  'apgarScoreTenMinutes',
  'timeOfBirth',
  'attendantAtBirth',
  'nameOfAttendantAtBirth',
  'birthFacilityId',
  'birthType',
  'registeredBirthPlace',
  'referralSourceId',
  'arrivalModeId',
  'prescriber',
  'prescriberId',
  'facility',
  'dischargeDisposition',
  'notGivenReasonId',
  'healthCenterId',
];

const mobilePatientModulesSchema = yup.object({
  programRegistries: yup.object({ hidden: yup.boolean() }),
  ...MOBILE_PATIENT_MODULES.reduce(
    (modules, module) => ({
      ...modules,
      [module]: mobilePatientModuleSchema,
    }),
    {},
  ),
});

const patientTabsSchema = yup.object({
  ...UNHIDEABLE_PATIENT_TABS.reduce(
    (tabs, tab) => ({
      ...tabs,
      [tab]: unhideablePatientTabSchema,
    }),
    {},
  ),
  ...HIDEABLE_PATIENT_TABS.reduce(
    (tabs, tab) => ({
      ...tabs,
      [tab]: patientTabSchema,
    }),
    {},
  ),
});

const SIDEBAR_ITEMS = {
  patients: ['patientsAll', 'patientsInpatients', 'patientsEmergency', 'patientsOutpatients'],
  scheduling: ['schedulingAppointments', 'schedulingCalendar', 'schedulingNew'],
  medication: ['medicationAll'],
  imaging: ['imagingActive', 'imagingCompleted'],
  labs: ['labsAll', 'labsPublished'],
  immunisations: ['immunisationsAll'],
  programRegistry: [],
  facilityAdmin: ['reports', 'bedManagement'],
};

const sidebarItemSchema = yup
  .object({
    sortPriority: yup.number().required(),
    hidden: yup.boolean(),
  })
  .required()
  .noUnknown();

// patients and patientsAll are intentionally not configurable
const sidebarSchema = yup
  .object(
    mapValues(SIDEBAR_ITEMS, (children, topItem) => {
      const childSchema = yup
        .object(
          children.reduce(
            (obj, childItem) =>
              childItem === 'patientsAll' ? obj : { ...obj, [childItem]: sidebarItemSchema },
            {},
          ),
        )
        .required()
        .noUnknown();

      return topItem === 'patients' ? childSchema : sidebarItemSchema.concat(childSchema);
    }),
  )
  .required()
  .noUnknown();

const imagingTypeSchema = yup
  .object({
    label: yup.string().required(),
  })
  .noUnknown();

const imagingTypesSchema = yup
  .object({
    ...Object.values(IMAGING_TYPES).reduce(
      (fields, field) => ({
        ...fields,
        [field]: imagingTypeSchema,
      }),
      {},
    ),
  })
  .required();

const rootLocalisationSchema = yup
  .object({
    units: yup.object({
      temperature: yup.string().oneOf(['celsius', 'fahrenheit']),
    }),
    country: {
      name: yup
        .string()
        .min(1)
        .required(),
      'alpha-2': yup
        .string()
        .uppercase()
        .length(2)
        .required(),
      'alpha-3': yup
        .string()
        .uppercase()
        .length(3)
        .required(),
    },
    timeZone: yup.string().nullable(),
    imagingTypes: imagingTypesSchema,
    previewUvciFormat: yup
      .string()
      .required()
      .oneOf(['tamanu', 'eudcc', 'icao']),
    disabledReports: yup.array(yup.string().required()).defined(),
    supportDeskUrl: yup.string().required(),
  })
  .required()
  .noUnknown();

// TODO: once localisation is persisted in the db, dynamically reload this
const unvalidatedLocalisation = defaultsDeep(config.localisation.data);
const localisationPromise = rootLocalisationSchema
  .validate(unvalidatedLocalisation, { strict: true, abortEarly: false })
  .then(l => {
    log.info('Localisation validated successfully.');
    return l;
  })
  .catch(e => {
    const errors = e.inner.map(inner => `\n  - ${inner.message}`);
    log.error(
      `Error(s) validating localisation (check localisation.data in your config):${errors}`,
    );

    if (!config.localisation.allowInvalid) {
      process.exit(1);
    }
  });

// this is asynchronous to help with a later move to more complicated localisation logic
export const getLocalisation = async () => {
  if (config.localisation.allowInvalid) {
    return unvalidatedLocalisation;
  }
  const localisation = await localisationPromise;
  return localisation;
};
