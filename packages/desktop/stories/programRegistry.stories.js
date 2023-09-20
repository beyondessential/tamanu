// @ts-check

import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { ChangeStatusFormModal } from '../app/views/programRegistry/ChangeStatusFormModal';
import { ApiContext } from '../app/api';
import { Modal } from '../app/components/Modal';
import { PROGRAM_REGISTRY } from '../app/components/PatientInfoPane/paneTitles';
import { InfoPaneList } from '../app/components/PatientInfoPane/InfoPaneList';
import { ProgramRegistryForm } from '../app/views/programRegistry/ProgramRegistryForm';
import { ProgramRegistryListItem } from '../app/views/programRegistry/ProgramRegistryListItem';
import { ProgramRegistryFormHistory } from '../app/views/programRegistry/ProgramRegistryFormHistory';
import { DisplayPatientRegDetails } from '../app/views/programRegistry/DisplayPatientRegDetails';
import { ProgramRegistryStatusHistory } from '../app/views/programRegistry/ProgramRegistryStatusHistory';
import { DeleteProgramRegistryFormModal } from '../app/views/programRegistry/DeleteProgramRegistryFormModal';
import { ActivateProgramRegistryFormModal } from '../app/views/programRegistry/ActivateProgramRegistryFormModal';
import { ProgramRegistryView } from '../app/views/programRegistry/ProgramRegistryView';
import { RemoveProgramRegistryFormModal } from '../app/views/programRegistry/RemoveProgramRegistryFormModal';
import { ProgramRegistrySelectSurvey } from '../app/views/programRegistry/ProgramRegistrySelectSurvey';

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
const programRegistriesForInfoPaneList = [
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

const patient = { id: 'patient_id' };
const programRegistry1 = {
  data: {
    id: '1',
    name: 'Hepatitis B',
    currentlyAtType: 'facility',
  },
};
const programRegistry2 = {
  data: {
    id: '2',
    name: 'Pneomonia',
    currentlyAtType: 'facility',
  },
};
const programRegistry3 = {
  data: {
    id: '3',
    name: 'Diabetis',
    currentlyAtType: 'village',
  },
};
const programRegistries = [programRegistry1.data, programRegistry2.data, programRegistry3.data];
const patientProgramRegistration = {
  id: 'program_registry_id',
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

const programRegistryStatusHistories = [
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

const programRegistryFormHistory = [
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

const facilities = [
  { id: '1', name: 'Hospital 1' },
  { id: '2', name: 'Hospital 2' },
];

const practitioners = [
  { id: 'test-user-id', name: 'Test user id' },
  { id: '2', name: 'Test user id 2' },
];

const programRegistryClinicalStatusList = [
  { id: '1', name: 'Low risk', color: 'green' },
  { id: '2', name: 'Needs review', color: 'yellow' },
  { id: '3', name: 'Critical', color: 'red' },
];

const dummyApi = {
  get: async (endpoint, options) => {
    console.log(endpoint);
    await sleep(500);
    switch (endpoint) {
      // case 'patient/patient_id/programRegistration/program_registry_id/clinicalStatuses':
      case 'patient/undefined/programRegistration/program_registry_id/clinicalStatuses':
        return getSortedData(programRegistryStatusHistories, options);
      case 'patient/patient_id/programRegistration/program_registry_id/surveyResponses':
        // case 'patient/undefined/programRegistration/program_registry_id/surveyResponses':
        return getSortedData(programRegistryFormHistory, options);
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
      case 'patient/undefined/programRegistration/undefined':
        return patientProgramRegistration;
    }
  },
};

//#region InfoPaneList

storiesOf('Program Registry', module).add('ProgramRegistry Info Panlist', () => {
  return (
    <ApiContext.Provider value={dummyApi}>
      <div style={{ width: '250px', backgroundColor: 'white', padding: '10px' }}>
        <InfoPaneList
          patient={patient}
          readonly={false}
          title={PROGRAM_REGISTRY}
          endpoint="programRegistry"
          getEndpoint={`patient/${patient.id}/program-registry`}
          Form={ProgramRegistryForm}
          ListItemComponent={ProgramRegistryListItem}
          getName={programRegistry => programRegistry.name}
          behavior="modal"
          itemTitle="Add program registry"
          getEditFormName={programRegistry => `Program registry: ${programRegistry.name}`}
          CustomEditForm={undefined}
        />
      </div>
    </ApiContext.Provider>
  );
});
//#endregion InfoPaneList

//#region ProgramRegistryForm

storiesOf('Program Registry', module).add('ProgramRegistryFrom', () => (
  // <MockedApi endpoints={mockProgramRegistrytFormEndpoints}>
  //     </MockedApi>
  <ApiContext.Provider value={dummyApi}>
    <Modal width="md" title="Add program registry" open>
      <ProgramRegistryForm
        onSubmit={action('submit')}
        onCancel={action('cancel')}
        patient={patient}
      />
    </Modal>
  </ApiContext.Provider>
));

//#endregion ProgramRegistryForm

//#region DisplayPatientRegDetails
storiesOf('Program Registry', module).add('DisplayPatientRegDetails Low risk', () => (
  <div style={{ width: '797px' }}>
    <DisplayPatientRegDetails patientProgramRegistration={patientProgramRegistration} />
  </div>
));

storiesOf('Program Registry', module).add('DisplayPatientRegDetails Critical', () => (
  <div style={{ width: '797px' }}>
    <DisplayPatientRegDetails
      patientProgramRegistration={{
        ...patientProgramRegistration,
        registrationStatus: 'removed',
        programRegistryClinicalStatus: {
          id: '1',
          code: 'critical',
          name: 'Critical',
          color: 'red',
        },
      }}
    />
  </div>
));

storiesOf('Program Registry', module).add('DisplayPatientRegDetails Needs review', () => (
  <div style={{ width: '797px' }}>
    <DisplayPatientRegDetails
      patientProgramRegistration={{
        ...patientProgramRegistration,
        registrationStatus: 'active',
        programRegistryClinicalStatus: {
          id: '1',
          code: 'needs_review',
          name: 'Needs review',
          color: 'yellow',
        },
      }}
    />
  </div>
));
//#endregion DisplayPatientRegDetails

//#region ProgramRegistryStatusHistory

storiesOf('Program Registry', module).add('ProgramRegistryStatusHistory removed never', () => (
  <ApiContext.Provider value={dummyApi}>
    <ProgramRegistryStatusHistory
      patientProgramRegistration={{
        id: 'program_registry_id',
      }}
    />
  </ApiContext.Provider>
));

storiesOf('Program Registry', module).add('ProgramRegistryStatusHistory removed once', () => (
  <ApiContext.Provider value={dummyApi}>
    <ProgramRegistryStatusHistory
      patientProgramRegistration={{
        id: 'program_registry_id',
      }}
    />
  </ApiContext.Provider>
));

//#endregion ProgramRegistryStatusHistory

//#region ProgramRegistryFormHistory

storiesOf('Program Registry', module).add('ProgramRegistryFormHistory', () => (
  <ApiContext.Provider value={dummyApi}>
    <ProgramRegistryFormHistory patientProgramRegistration={patientProgramRegistration} />
  </ApiContext.Provider>
));
//#endregion ProgramRegistryFormHistory

//#region ChangeStatusFormModal

storiesOf('Program Registry', module).add('ProgramRegistry Status Change', () => {
  return (
    <ApiContext.Provider value={dummyApi}>
      <ChangeStatusFormModal
        // onSubmit={action('submit')}
        // onCancel={action('cancel')}
        patientProgramRegistration={patientProgramRegistration}
        // open
      />
    </ApiContext.Provider>
  );
});

//#endregion ChangeStatusFormModal

//#region DeleteProgramRegistryFormModal
storiesOf('Program Registry', module).add('ProgramRegistry Delete Modal', () => {
  return (
    <DeleteProgramRegistryFormModal
      open
      programRegistry={{ name: 'Hepatitis B' }}
      onSubmit={action('submit')}
      onCancel={action('cancel')}
    />
  );
});
//#endregion DeleteProgramRegistryFormModal

//#region

storiesOf('Program Registry', module).add('ActivateProgramRegistryFormModal', () => (
  <ApiContext.Provider value={dummyApi}>
    <ActivateProgramRegistryFormModal
      onSubmit={action('submit')}
      onCancel={action('cancel')}
      patientProgramRegistration={patientProgramRegistration}
      open
    />
  </ApiContext.Provider>
));
//#endregion

//#region RemoveProgramRegistryFormModal
storiesOf('Program Registry', module).add('RemoveProgramRegistryFormModal', () => (
  <ApiContext.Provider value={dummyApi}>
    <RemoveProgramRegistryFormModal
      patientProgramRegistration={patientProgramRegistration}
      onSubmit={action('submit')}
      onCancel={action('cancel')}
      open
    />
  </ApiContext.Provider>
));
//#endregion RemoveProgramRegistryFormModal

//#region ProgramRegistrySelectSurvey
storiesOf('Program Registry', module).add('ProgramRegistrySelectSurvey', () => (
  <ApiContext.Provider value={dummyApi}>
    <ProgramRegistrySelectSurvey
      patientProgramRegistration={patientProgramRegistration}
      // patient={patient}
    />
  </ApiContext.Provider>
));
//#endregion ProgramRegistrySelectSurvey

//#region ProgramRegistryView
storiesOf('Program Registry', module).add('ProgramRegistryView', () => (
  <ApiContext.Provider value={dummyApi}>
    <ProgramRegistryView />
  </ApiContext.Provider>
));
//#endregion ProgramRegistryView
