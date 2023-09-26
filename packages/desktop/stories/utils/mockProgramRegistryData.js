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
export const mockSurvey = {
  id: 'program-demncdprimaryscreening-demcvdprimaryscreen2',
  code: 'demcvdprimaryscreen2',
  name: 'CVD Primary Screening Form',
  surveyType: 'programs',
  isSensitive: true,
  updatedAtSyncTick: '-999',
  createdAt: '2023-07-11T22:01:02.375Z',
  updatedAt: '2023-07-11T22:01:02.375Z',
  programId: 'program-demncdprimaryscreening',
  components: [
    {
      id: 'program-demncdprimaryscreening-demcvdprimaryscreen2-DemCVD01',
      screenIndex: 0,
      componentIndex: 0,
      text: '',
      visibilityCriteria: '',
      validationCriteria: '',
      detail: '',
      config: '',
      calculation: '',
      updatedAtSyncTick: '-999',
      createdAt: '2023-07-11T22:01:02.409Z',
      updatedAt: '2023-07-11T22:01:02.409Z',
      surveyId: 'program-demncdprimaryscreening-demcvdprimaryscreen2',
      dataElementId: 'pde-DemCVD01',
      dataElement: {
        id: 'pde-DemCVD01',
        code: 'DemCVD01',
        name: 'Section 1: Lifestyle Questions',
        indicator: null,
        defaultText: 'Section 1: Lifestyle Questions',
        visualisationConfig: null,
        type: 'Instruction',
        updatedAtSyncTick: '-999',
        createdAt: '2023-07-11T22:01:02.286Z',
        updatedAt: '2023-07-11T22:01:02.286Z',
        defaultOptions: null,
      },
      options: null,
    },
    {
      id: 'program-demncdprimaryscreening-demcvdprimaryscreen2-DemCVD02',
      screenIndex: 0,
      componentIndex: 1,
      text: '',
      visibilityCriteria: '',
      validationCriteria: '',
      detail: '',
      config: '',
      calculation: '',
      updatedAtSyncTick: '-999',
      createdAt: '2023-07-11T22:01:02.409Z',
      updatedAt: '2023-07-11T22:01:02.409Z',
      surveyId: 'program-demncdprimaryscreening-demcvdprimaryscreen2',
      dataElementId: 'pde-DemCVD02',
      dataElement: {
        id: 'pde-DemCVD02',
        code: 'DemCVD02',
        name: 'Exercise in an average week',
        indicator: null,
        defaultText:
          'How often do you exercise in an average week? (Definition of exercise = 150 mins/week of moderate-vigorous intensity)',
        visualisationConfig: null,
        type: 'Select',
        updatedAtSyncTick: '-999',
        createdAt: '2023-07-11T22:01:02.286Z',
        updatedAt: '2023-07-11T22:01:02.286Z',
        defaultOptions: {
          'More than five (30 min) sessions': 'More than five (30 min) sessions',
          'Less than five (30 min) sessions': 'Less than five (30 min) sessions',
          '0 hours': '0 hours',
        },
      },
      options: null,
    },
  ],
};
export const programRegistriesForInfoPaneList = [
  {
    id: '1',
    name: 'Seasonal fever',
    status: 'Removed',
    clinicalStatus: 'Needs review',
  },
  {
    id: '12',
    name: 'Hepatities B',
    status: 'Active',
    clinicalStatus: 'Low risk',
  },
  {
    id: '13',
    name: 'Covid',
    status: 'Removed',
    clinicalStatus: 'Critical',
  },
  {
    id: '14',
    name: 'Dengue',
    status: 'Active',
    clinicalStatus: 'Needs review',
  },
  {
    id: '15',
    name: 'Diabetis',
    status: 'Active',
    clinicalStatus: 'Critical',
  },
  {
    id: '16',
    name: 'Typhoid',
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

export const programRegistryStatusHistories = [
  {
    id: '1',
    registrationStatus: 'removed',
    // registrationStatus: 'active',
    programRegistryClinicalStatusId: '1',
    programRegistryClinicalStatus: {
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
    programRegistryClinicalStatusId: '2',
    programRegistryClinicalStatus: {
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
    programRegistryClinicalStatusId: '3',
    programRegistryClinicalStatus: {
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
    programRegistryClinicalStatusId: '4',
    programRegistryClinicalStatus: {
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
    programRegistryClinicalStatusId: '5',
    programRegistryClinicalStatus: {
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
    programRegistryClinicalStatusId: '6',
    programRegistryClinicalStatus: {
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

export const practitioners = [
  { id: 'test-user-id', name: 'Test user id' },
  { id: '2', name: 'Test user id 2' },
];

export const programRegistryClinicalStatusList = [
  { id: '1', name: 'Low risk', color: 'green' },
  { id: '2', name: 'Needs review', color: 'yellow' },
  { id: '3', name: 'Critical', color: 'red' },
];

export const programRegistrysurveys = {
  count: 6,
  data: [
    {
      id: 'program-samoancdscreening-sampensnpref',
      code: 'sampensnpREF',
      name: 'School Nurse Program Referral',
      surveyType: 'referral',
      isSensitive: false,
      updatedAtSyncTick: '-999',
      createdAt: '2023-08-15T03:03:04.026Z',
      updatedAt: '2023-08-15T03:03:04.026Z',
      programId: 'program-samoancdscreening',
    },
    {
      id: 'program-samoancdscreening-sampenkapsur',
      code: 'sampenkapSUR',
      name: 'Knowledge, Awareness and Practices Survey',
      surveyType: 'programs',
      isSensitive: false,
      updatedAtSyncTick: '-999',
      createdAt: '2023-08-15T03:03:04.026Z',
      updatedAt: '2023-08-15T03:03:04.026Z',
      programId: 'program-samoancdscreening',
    },
    {
      id: 'program-samoancdscreening-sampensnpass',
      code: 'sampensnpASS',
      name: 'School Nurse Program Assessment',
      surveyType: 'programs',
      isSensitive: false,
      updatedAtSyncTick: '-999',
      createdAt: '2023-08-15T03:03:04.026Z',
      updatedAt: '2023-08-15T03:03:04.026Z',
      programId: 'program-samoancdscreening',
    },
    {
      id: 'program-samoancdscreening-sampensnpcon',
      code: 'sampensnpCON',
      name: 'School Nurse Program Consent',
      surveyType: 'programs',
      isSensitive: false,
      updatedAtSyncTick: '-999',
      createdAt: '2023-08-15T03:03:04.026Z',
      updatedAt: '2023-08-15T03:03:04.026Z',
      programId: 'program-samoancdscreening',
    },
    {
      id: 'program-samoancdscreening-sampenvilfrm',
      code: 'sampenvilFRM',
      name: 'Village Screening Form',
      surveyType: 'programs',
      isSensitive: false,
      updatedAtSyncTick: '-999',
      createdAt: '2023-08-15T03:03:04.026Z',
      updatedAt: '2023-08-15T03:03:04.026Z',
      programId: 'program-samoancdscreening',
    },
    {
      id: 'program-samoancdscreening-sampenvillref',
      code: 'sampenvillref',
      name: 'Village Screening Referral',
      surveyType: 'referral',
      isSensitive: false,
      updatedAtSyncTick: '-999',
      createdAt: '2023-08-15T03:03:04.026Z',
      updatedAt: '2023-08-15T03:03:04.026Z',
      programId: 'program-samoancdscreening',
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
  id: 'program_registry_id',
  programId: 'program_id',
  program: {
    id: 'program_id',
    name: 'Hepatitis B',
  },
  patientId: 'patient_id',
  patient: {
    id: 'patient_id',
    name: 'Tareq',
  },
  date: '2023-08-28T02:40:16.237Z',
  name: 'Hepatitis B',
  programRegistryClinicalStatusId: '1',
  programRegistryClinicalStatus: {
    id: '1',
    code: 'low_risk',
    name: 'Low risk',
    color: 'green',
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
  registrationStatus: 'active',
  // registrationStatus: 'removed',
  removedById: '213123',
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
      case 'patient/undefined/programRegistration/undefined':
      case 'patient/patient_id/programRegistration/program_registry_id':
        console.log('i should be printed');
        return patientProgramRegistration;
      case 'patient/patient_id/additionalData':
        return patientAdditionalData;
      case 'patient/patient_id/programRegistration/program_registry_id/clinicalStatuses':
      case 'patient/undefined/programRegistration/program_registry_id/clinicalStatuses':
        return getSortedData(programRegistryStatusHistories, options);
      case 'patient/patient_id/programRegistration/program_registry_id/surveyResponses':
      case 'patient/undefined/programRegistration/program_registry_id/surveyResponses':
        return getSortedData(programRegistryFormHistory, options);
      case 'patient/undefined/programRegistration/undefined/survey/undefined':
        return mockSurvey;
      case 'suggestions/facility':
        return facilities;
      case 'suggestions/practitioner':
        return practitioners;
      case 'suggestions/programRegistryClinicalStatus':
        return programRegistryClinicalStatusList;
      case 'suggestions/programRegistries':
        return programRegistries;
      case 'suggestions/survey':
        return programRegistryFormHistory.map(x => ({ id: x.id.toString(), name: x.survey.name }));
      case 'programRegistry/1':
        return programRegistry1;
      case 'programRegistry/2':
        return programRegistry2;
      case 'programRegistry/3':
        return programRegistry3;
      case 'patient/patient_id/program-registry':
        return { data: programRegistriesForInfoPaneList };
      // case 'patient/patient_id/programRegistration/program_registry_id':
      case 'program/program_id/surveys':
        return programRegistrysurveys;
      // case 'programRegistration/program_registry_id/survey/survey_id':
    }
  },
};
