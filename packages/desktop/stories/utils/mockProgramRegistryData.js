//@ts-check
function sleep(milliseconds) {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}
const getSortedData = (
  list = [],
  options = { page: 0, orderBy: '', order: 'asc', rowsPerPage: 10 },
) => {
  const sortedData =
    options.order && options.orderBy
      ? list.sort(({ [options.orderBy]: a }, { [options.orderBy]: b }) => {
          if (typeof a === 'string') {
            return options.order === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
          }
          return options.order === 'asc' ? a - b : b - a;
        })
      : list;
  const startIndex = options.page * options.rowsPerPage || 0;
  const endIndex = startIndex + options.rowsPerPage ? options.rowsPerPage : sortedData.length;
  return {
    data: sortedData.slice(startIndex, endIndex),
    count: list.length,
  };
};
const mockSurvey = {
  id: 'program-tbprogram-tbfollowup',
  code: 'tbfollowup',
  name: 'TB Follow Up',
  surveyType: 'programs',
  isSensitive: false,
  updatedAtSyncTick: '-999',
  createdAt: '2023-09-27T22:21:03.107Z',
  updatedAt: '2023-09-27T22:21:03.107Z',
  programId: 'program-tbprogram',
  components: [
    {
      id: 'program-tbprogram-tbfollowup-PHTBFU001',
      screenIndex: 0,
      componentIndex: 0,
      text: '',
      visibilityCriteria: '',
      validationCriteria: '',
      detail: '',
      config: '{"source": "program-samoapubhealth-phtbcasesurvey"}',
      calculation: '',
      updatedAtSyncTick: '-999',
      createdAt: '2023-09-27T22:21:03.178Z',
      updatedAt: '2023-09-27T22:21:03.178Z',
      surveyId: 'program-tbprogram-tbfollowup',
      dataElementId: 'pde-PHTBFU001',
      dataElement: {
        id: 'pde-PHTBFU001',
        code: 'PHTBFU001',
        name: 'Initial screening survey',
        indicator: null,
        defaultText: 'Initial screening survey',
        visualisationConfig: '',
        type: 'SurveyLink',
        updatedAtSyncTick: '-999',
        createdAt: '2023-09-27T22:21:02.898Z',
        updatedAt: '2023-09-27T22:21:02.898Z',
        defaultOptions: null,
      },
      options: null,
    },
    {
      id: 'program-tbprogram-tbfollowup-PHTBFU0001a',
      screenIndex: 0,
      componentIndex: 0,
      text: '',
      visibilityCriteria: '',
      validationCriteria: '',
      detail: '',
      config: '{"source": "program-samoapubhealth-phtbcasesurvey2"}',
      calculation: '',
      updatedAtSyncTick: '-999',
      createdAt: '2023-09-27T22:21:03.178Z',
      updatedAt: '2023-09-27T22:21:03.178Z',
      surveyId: 'program-tbprogram-tbfollowup',
      dataElementId: 'pde-PHTBFU001a',
      dataElement: {
        id: 'pde-PHTBFU001a',
        code: 'PHTBFU001a',
        name: 'Registration status',
        indicator: null,
        defaultText: 'Registration status',
        visualisationConfig: '',
        type: 'Select',
        updatedAtSyncTick: '-999',
        createdAt: '2023-09-27T22:21:02.898Z',
        updatedAt: '2023-09-27T22:21:02.898Z',
        defaultOptions: { active: 'active', inactive: 'inactive' },
      },
      options: null,
    },
    {
      id: 'program-tbprogram-tbfollowup-PHTBFU0010',
      screenIndex: 0,
      componentIndex: 0,
      text: '',
      visibilityCriteria: '',
      validationCriteria: '',
      detail: '',
      config:
        '{"column": "educationalLevel", "writeToPatient": { "fieldName": "educationalLevel","isAdditionalDataField": true }}',
      calculation: '',
      updatedAtSyncTick: '-999',
      createdAt: '2023-09-27T22:21:03.178Z',
      updatedAt: '2023-09-27T22:21:03.178Z',
      surveyId: 'program-tbprogram-tbfollowup',
      dataElementId: 'pde-PHTBFU001',
      dataElement: {
        id: 'pde-PHTBFU001',
        code: 'PHTBFU001',
        name: 'Educational Level',
        indicator: null,
        defaultText: 'Educational Level',
        visualisationConfig: '',
        type: 'PatientData',
        updatedAtSyncTick: '-999',
        createdAt: '2023-09-27T22:21:02.898Z',
        updatedAt: '2023-09-27T22:21:02.898Z',
        defaultOptions: null,
      },
      options: null,
    },
    {
      id: 'program-tbprogram-tbfollowup-PHTBFU001a',
      screenIndex: 0,
      componentIndex: 1,
      text: '',
      visibilityCriteria: '',
      validationCriteria: '',
      detail: '',
      config:
        '{"source":"Village", "column": "registrationCurrentlyAtVillage", "writeToPatient": { "fieldName": "registrationCurrentlyAtVillage", "isProgramRegistration": true }}',
      calculation: '',
      updatedAtSyncTick: '-999',
      createdAt: '2023-09-27T22:21:03.178Z',
      updatedAt: '2023-09-27T22:21:03.178Z',
      surveyId: 'program-tbprogram-tbfollowup',
      dataElementId: 'pde-PHTBFU001a',
      dataElement: {
        id: 'pde-PHTBFU001a',
        code: 'PHTBFU001a',
        name: 'Current village',
        indicator: null,
        defaultText: 'Current village',
        visualisationConfig: '',
        type: 'Autocomplete',
        updatedAtSyncTick: '-999',
        createdAt: '2023-09-27T22:21:02.898Z',
        updatedAt: '2023-09-27T22:21:02.898Z',
        defaultOptions: null,
      },
      options: null,
    },
    {
      id: 'program-tbprogram-tbfollowup-PHTBFU013a',
      screenIndex: 0,
      componentIndex: 18,
      text: '',
      visibilityCriteria: '',
      validationCriteria: '',
      detail: '',
      config:
        '{"source":"ProgramRegistryClinicalStatus","column": "registrationClinicalStatus", "writeToPatient": { "fieldName": "registrationClinicalStatus","isProgramRegistration": true }}',
      calculation: '',
      updatedAtSyncTick: '-999',
      createdAt: '2023-09-27T22:21:03.178Z',
      updatedAt: '2023-09-27T22:21:03.178Z',
      surveyId: 'program-tbprogram-tbfollowup',
      dataElementId: 'pde-PHTBFU013a',
      dataElement: {
        id: 'pde-PHTBFU013a',
        code: 'PHTBFU013a',
        name: 'Clinical status',
        indicator: null,
        defaultText: 'Clinical status',
        visualisationConfig: '',
        type: 'Autocomplete',
        updatedAtSyncTick: '-999',
        createdAt: '2023-09-27T22:21:02.898Z',
        updatedAt: '2023-09-27T22:21:02.898Z',
        defaultOptions: null,
      },
      options: null,
    },
    {
      id: 'program-tbprogram-tbfollowup-PHTBFU014',
      screenIndex: 0,
      componentIndex: 19,
      text: '',
      visibilityCriteria: '',
      validationCriteria: '',
      detail: '',
      config: '',
      calculation: '',
      updatedAtSyncTick: '-999',
      createdAt: '2023-09-27T22:21:03.178Z',
      updatedAt: '2023-09-27T22:21:03.178Z',
      surveyId: 'program-tbprogram-tbfollowup',
      dataElementId: 'pde-PHTBFU014',
      dataElement: {
        id: 'pde-PHTBFU014',
        code: 'PHTBFU014',
        name: 'Comments',
        indicator: null,
        defaultText: 'Comments',
        visualisationConfig: '',
        type: 'FreeText',
        updatedAtSyncTick: '-999',
        createdAt: '2023-09-27T22:21:02.898Z',
        updatedAt: '2023-09-27T22:21:02.898Z',
        defaultOptions: null,
      },
      options: null,
    },
  ],
};
export const programRegistriesForInfoPaneList = [
  {
    id: '1',
    name: 'Seasonal fever',
    code: 'Seasonalfever',
    status: 'Removed',
    clinicalStatus: 'Needs review',
  },
  {
    id: '12',
    name: 'Hepatities B',
    code: 'HepatitiesB',
    status: 'Active',
    clinicalStatus: 'Low risk',
  },
  {
    id: '13',
    name: 'Covid',
    code: 'Covid',
    status: 'Removed',
    clinicalStatus: 'Critical',
  },
  {
    id: '14',
    name: 'Dengue',
    code: 'Dengue',
    status: 'Active',
    clinicalStatus: 'Needs review',
  },
  {
    id: '15',
    name: 'Diabetis',
    code: 'Diabetis',
    status: 'Active',
    clinicalStatus: 'Critical',
  },
  {
    id: '16',
    name: 'Typhoid',
    code: 'Typhoid',
    status: 'Removed',
    clinicalStatus: 'Low risk',
  },
];

export const patient = { id: 'patient_id' };
export const programRegistry1 = {
  data: {
    id: '1',
    name: 'Hepatitis B',
    currentlyAtType: 'facility',
  },
};
export const programRegistry2 = {
  data: {
    id: '2',
    name: 'Pneomonia',
    currentlyAtType: 'facility',
  },
};
export const programRegistry3 = {
  data: {
    id: '3',
    name: 'Diabetis',
    currentlyAtType: 'village',
  },
};

export const programRegistries = [
  programRegistry1.data,
  programRegistry2.data,
  programRegistry3.data,
];

export const programRegistryConditions = [
  { id: '1', name: 'Diabetes' },
  { id: '2', name: 'Hypertension' },
  { id: '3', name: 'Low pressure' },
  { id: '4', name: 'Migrain' },
  { id: '5', name: 'Joint pain' },
  { id: '6', name: 'Skin itching' },
  { id: '7', name: 'Tuberculosis of lung, bacteriologically and historically negative' },
];

export const programRegistryStatusHistories = [
  {
    id: '1',
    // registrationStatus: 'removed',
    registrationStatus: 'active',
    clinicalStatusId: '1',
    clinicalStatus: {
      id: '1',
      name: 'Low risk',
      color: 'green',
    },
    clinicianId: '1',
    clinician: {
      id: '1',
      displayName: 'Tareq The First',
    },
    date: '2023-08-28T02:40:16.237Z',
    registrationDate: '2023-08-28T02:40:16.237Z',
  },
  {
    id: '2',
    registrationStatus: 'active',
    clinicalStatusId: '2',
    clinicalStatus: {
      id: '2',
      name: 'Needs review',
      color: 'yellow',
    },
    clinicianId: '2',
    clinician: {
      id: '2',
      displayName: 'Aziz',
    },
    date: '2023-08-28T02:40:16.237Z',
    registrationDate: '2023-08-28T02:40:16.237Z',
  },
  {
    id: '3',
    registrationStatus: 'active',
    clinicalStatusId: '3',
    clinicalStatus: {
      id: '3',
      name: 'Critical',
      color: 'red',
    },
    clinicianId: '3',
    clinician: {
      id: '3',
      displayName: 'Torun',
    },
    date: '2023-08-28T02:40:16.237Z',
    registrationDate: '2023-08-28T02:40:16.237Z',
  },
  {
    id: '4',
    registrationStatus: 'active',
    clinicalStatusId: '4',
    clinicalStatus: {
      id: '4',
      name: 'Needs review',
      color: 'yellow',
    },
    clinicianId: '4',
    clinician: {
      id: '4',
      displayName: 'Taslim',
    },
    date: '2023-08-28T02:40:16.237Z',
    registrationDate: '2023-08-28T02:40:16.237Z',
  },
  {
    id: '5',
    registrationStatus: 'active',
    clinicalStatusId: '5',
    clinicalStatus: {
      id: '5',
      name: 'Low risk',
      color: 'green',
    },
    clinicianId: '5',
    clinician: {
      id: '5',
      displayName: 'Tareq',
    },
    date: '2023-08-28T02:40:16.237Z',
    registrationDate: '2023-08-28T02:40:16.237Z',
  },
  {
    id: '6',
    registrationStatus: 'active',
    clinicalStatusId: '6',
    clinicalStatus: {
      id: '6',
      name: 'Needs review',
      color: 'yellow',
    },
    clinicianId: '6',
    clinician: {
      id: '6',
      displayName: 'Aziz',
    },
    date: '2023-08-28T02:40:16.237Z',
    registrationDate: '2023-08-28T02:40:16.237Z',
  },
];

export const programRegistryFormHistory = [
  {
    id: 1,
    endTime: '2023-09-07 15:54:00',
    userId: '10',
    user: {
      displayName: 'Hyacinthie',
    },
    surveyId: '100000',
    survey: {
      name: 'Engineering',
    },
    result: '9851',
    resultText: '9851',
  },
  {
    id: 2,
    endTime: '2023-09-07 15:54:00',
    userId: '20',
    user: {
      displayName: 'Mame',
    },
    surveyId: '200000',
    survey: {
      name: 'Marketing',
    },
    result: '1160',
    resultText: '1160',
  },
  {
    id: 3,
    endTime: '2023-09-07 15:54:00',
    userId: '30',
    user: {
      displayName: 'Orland',
    },
    surveyId: '300000',
    survey: {
      name: 'Product Management',
    },
    result: '3634',
    resultText: '3634',
  },
  {
    id: 4,
    endTime: '2023-09-07 15:54:00',
    userId: '40',
    user: {
      displayName: 'Noell',
    },
    surveyId: '400000',
    survey: {
      name: 'Engineering',
    },
    result: '8025',
    resultText: '8025',
  },
  {
    id: 5,
    endTime: '2023-09-07 15:54:00',
    userId: '50',
    user: {
      displayName: 'Hinda',
    },
    surveyId: '500000',
    survey: {
      name: 'Services',
    },
    result: '9631',
    resultText: '9631',
  },
  {
    id: 6,
    endTime: '2023-09-07 15:54:00',
    userId: '60',
    user: {
      displayName: 'Abbey',
    },
    surveyId: '600000',
    survey: {
      name: 'Marketing',
    },
    result: '6816',
    resultText: '6816',
  },
  {
    id: 7,
    endTime: '2023-09-07 15:54:00',
    userId: '70',
    user: {
      displayName: 'Ginelle',
    },
    surveyId: '700000',
    survey: {
      name: 'Human Resources',
    },
    result: '4687',
    resultText: '4687',
  },
];

export const facilities = [
  { id: '1', name: 'Hospital 1' },
  { id: '2', name: 'Hospital 2' },
];

export const villages = [
  { id: 'village-1', name: 'Village 1' },
  { id: 'village-2', name: 'Village 2' },
];

export const practitioners = [
  { id: 'test-user-id', name: 'Test user id' },
  { id: '2', name: 'Test user id 2' },
];

export const clinicalStatusList = [
  { id: '1', name: 'Low risk', color: 'green' },
  { id: '2', name: 'Needs review', color: 'yellow' },
  { id: '3', name: 'Critical', color: 'red' },
];

export const programRegistrysurveys = {
  count: 2,
  data: [
    {
      id: 'program-tbprogram-tbfollowup',
      code: 'tbfollowup',
      name: 'TB Follow Up',
      surveyType: 'programs',
      isSensitive: false,
      updatedAtSyncTick: '-999',
      createdAt: '2023-09-27T22:21:03.107Z',
      updatedAt: '2023-09-27T22:21:03.107Z',
      programId: 'program-tbprogram',
    },
    {
      id: 'program-tbprogram-tbcaseform',
      code: 'tbcaseform',
      name: 'Confirmed TB Form',
      surveyType: 'programs',
      isSensitive: false,
      updatedAtSyncTick: '-999',
      createdAt: '2023-09-27T22:21:03.107Z',
      updatedAt: '2023-09-27T22:21:03.107Z',
      programId: 'program-tbprogram',
    },
  ],
};

export const patientAdditionalData = {
  id: '19324abf-b485-4184-8537-0a7fe4be1d0b',
  patientId: 'patient_id',
  placeOfBirth: '247813',
  bloodType: 'A+',
  primaryContactNumber: '247813',
  secondaryContactNumber: 'Daddy Antonini',
  maritalStatus: 'Married',
  cityTown: '247813',
  streetVillage: '247813',
  educationalLevel: 'High school completed',
  socialMedia: 'Twitter',
  title: 'Mr',
  birthCertificate: 'BC247813',
  drivingLicense: 'DL247813',
  passport: 'PP247813',
  emergencyContactName: '247813',
  emergencyContactNumber: '247813',
  updatedAtByField: {
    id: 500664,
    birth_certificate: 500664,
    driving_license: 500664,
    passport: 500664,
    patient_id: 500664,
    primary_contact_number: 500664,
    secondary_contact_number: 500664,
    emergency_contact_name: 500664,
    emergency_contact_number: 500664,
    place_of_birth: 500664,
    title: 500664,
    blood_type: 500664,
    marital_status: 500664,
    educational_level: 500664,
    social_media: 500664,
    religion_id: 500664,
    patient_billing_type_id: 500664,
    country_of_birth_id: 500664,
    nationality_id: 500664,
    ethnicity_id: 500664,
    occupation_id: 500664,
    city_town: 500664,
    street_village: 500664,
    country_id: 500664,
    division_id: 500664,
    subdivision_id: 500664,
    medical_area_id: 500664,
    nursing_zone_id: 500664,
    settlement_id: 500664,
  },
  updatedAtSyncTick: '-999',
  createdAt: '2023-08-18T01:06:03.724Z',
  updatedAt: '2023-08-18T01:06:03.724Z',
  nationalityId: 'nationality-Andorra',
  countryId: 'country-Andorra',
  divisionId: 'division-Eastern',
  subdivisionId: 'subdivision-Ba',
  medicalAreaId: 'medicalArea-Beqa',
  nursingZoneId: 'nursingZone-Bagasau',
  settlementId: 'settlement-ats',
  ethnicityId: 'ethnicity-Fiji',
  occupationId: 'occupation-CivilServant',
  religionId: 'religion-Christian',
  patientBillingTypeId: 'patientBillingType-local',
  countryOfBirthId: 'country-Andorra',
  countryOfBirth: {
    id: 'country-Andorra',
    code: 'Andorra',
    type: 'country',
    name: 'Andorra',
    visibilityStatus: 'current',
    updatedAtSyncTick: '-999',
    createdAt: '2023-07-21T02:14:08.902Z',
    updatedAt: '2023-07-21T02:14:08.902Z',
  },
  nationality: {
    id: 'nationality-Andorra',
    code: 'Andorra',
    type: 'nationality',
    name: 'Andorra',
    visibilityStatus: 'current',
    updatedAtSyncTick: '-999',
    createdAt: '2023-07-21T02:14:08.902Z',
    updatedAt: '2023-07-21T02:14:08.902Z',
  },
  country: {
    id: 'country-Andorra',
    code: 'Andorra',
    type: 'country',
    name: 'Andorra',
    visibilityStatus: 'current',
    updatedAtSyncTick: '-999',
    createdAt: '2023-07-21T02:14:08.902Z',
    updatedAt: '2023-07-21T02:14:08.902Z',
  },
};

export const patientProgramRegistration = {
  id: 'patient_program_registry_id',
  programRegistryId: 'program_registry_id',
  programRegistry: {
    id: 'program_registry_id',
    name: 'Hepatitis B',
    program: {
      id: 'program_id',
      name: 'Hepatitis B',
    },
  },
  patientId: 'patient_id',
  patient: {
    id: 'patient_id',
    name: 'Tareq',
  },
  clinicianId: '213123',
  clinician: {
    id: '213123',
    displayName: 'Alaister',
  },
  registeringFacilityId: 'registering_facility_id',
  registeringFacility: {
    id: 'registering_facility_id',
    code: 'registring_facitlity',
    name: 'Hospital 1',
  },
  facitlityId: 'facitliId',
  facitlity: {
    id: 'facitliId',
    name: 'Facility A',
  },
  villageId: 'villageId',
  village: {
    id: 'village-1',
    name: 'Village 1',
  },
  clinicalStatusId: '1',
  clinicalStatus: {
    id: '1',
    code: 'low_risk',
    name: 'Low risk',
    color: 'green',
  },

  registrationStatus: 'active',
  date: '2023-08-28T02:40:16.237Z',
  // name: 'Hepatitis B',
  // registrationStatus: 'removed',
  removedById: '213123',
  dateRemoved: '2023-08-28T02:40:16.237Z',
  removedBy: {
    id: '213123',
    displayName: 'Alaister',
  },
};

export const dummyApi = {
  get: async (endpoint, options) => {
    console.log(endpoint);
    await sleep(500);
    switch (endpoint) {
      case 'programRegistry/1':
        return programRegistry1;

      case 'programRegistry/2':
        return programRegistry2;

      case 'programRegistry/3':
        return programRegistry3;

      case 'programRegistry/1/conditions':
      case 'programRegistry/program_registry_id/conditions':
        return programRegistryConditions;

      case 'patient/patient_id/additionalData':
      case 'patient/test-patient/additionalData':
        return patientAdditionalData;

      // GET patientProgramRestration Status change Histories
      case 'patient/patient_id/programRegistration/patient_program_registry_id/clinicalStatuses':
        return getSortedData(programRegistryStatusHistories, options);

      case 'patient/patient_id/programResponses?programId=program_id':
      case '/patient/test-patient/programResponses':
        return getSortedData(programRegistryFormHistory, options);

      case `patient/programRegistration/patient_program_registry_id/conditions`:
        return [
          ...programRegistryConditions,
          ...programRegistryConditions.map(x => ({ ...x, id: x.id + 1 })),
        ];

      case 'program/program_id/surveys':
        return programRegistrysurveys;

      case 'suggestions/programRegistryClinicalStatus':
        return clinicalStatusList;

      case 'suggestions/facility':
        return facilities;

      case 'suggestions/village':
        return villages;

      case 'suggestions/practitioner':
        return practitioners;

      case 'suggestions/programRegistryClinicalStatus':
        return clinicalStatusList;

      case 'suggestions/programRegistry':
        return programRegistries;

      case 'suggestions/survey':
        // this needs to be done in the backend
        return programRegistryFormHistory.map(x => ({ id: x.id.toString(), name: x.survey.name }));

      // TEMP: below there are undefined parameters because this api sometimes depends
      // on browser query params, this is temporary for testing purpose
      case 'patient/patient_id/programRegistration/patient_program_registry_id':
      case 'patient/undefined/programRegistration/patient_program_registry_id':
      case 'patient/test-patient/programRegistration/undefined':
      case 'patient/undefined/programRegistration/undefined':
        return patientProgramRegistration;
      case 'patient/undefined/programRegistration/undefined/survey/undefined':
      case 'patient/patient_id/programRegistration/patient_program_registry_id/survey/survey_id':
        return mockSurvey;
    }
  },
};
