import React from 'react';
import { action } from '@storybook/addon-actions';
import { ApiContext } from '../app/api';
import { MockedApi } from './utils/mockedApi';
import { Modal } from '../app/components/Modal';
import { InfoPaneList } from '../app/components/PatientInfoPane/InfoPaneList';
import { ProgramRegistryForm } from '../app/views/programRegistry/ProgramRegistryForm';
import { ProgramRegistryListItem } from '../app/views/programRegistry/ProgramRegistryListItem';
import { PROGRAM_REGISTRY } from '../app/components/PatientInfoPane/paneTitles';
import { DisplayPatientRegDetails } from '../app/views/programRegistry/DisplayPatientRegDetails';
import { storiesOf } from '@storybook/react';
import { ProgramRegistryStatusHistory } from '../app/views/programRegistry/ProgramRegistryStatusHistory';

//#region ProgramRegistryForm
const mockProgramRegistrytFormEndpoints = {
  'program/1': () => ({
    data: {
      id: '1',
      currentlyAtType: 'facility',
    },
  }),
  'program/2': () => ({
    data: {
      id: '2',
      currentlyAtType: 'facility',
    },
  }),
  'program/3': () => ({
    data: {
      id: '3',
      currentlyAtType: 'village',
    },
  }),
  'suggestions/program': () => [
    { id: '1', name: 'Arm' },
    { id: '2', name: 'Leg' },
    { id: '3', name: 'Shoulder' },
  ],
  'suggestions/facility': () => [
    { id: '1', name: 'Hospital 1' },
    { id: '2', name: 'Hospital 2' },
  ],
  'suggestions/practitioner': () => [
    { id: 'test-user-id', name: 'Test user id' },
    { id: '2', name: 'Test user id 2' },
  ],
  'suggestions/programRegistryClinicalStatus': () => [
    { id: '1', name: 'current' },
    { id: '2', name: 'historical' },
    { id: '3', name: 'merged' },
  ],
};

storiesOf('Program Registry', module).add('ProgramRegistryFrom', () => (
  <MockedApi endpoints={mockProgramRegistrytFormEndpoints}>
    <Modal width="md" title="Add program registry" open>
      <ProgramRegistryForm
        onSubmit={action('submit')}
        onCancel={action('cancel')}
        patient={{ id: '323r2r234r' }}
      />
    </Modal>
  </MockedApi>
));

//#endregion ProgramRegistryForm

//#region ProgramRegistryStatusHistory

function sleep(milliseconds) {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}
const dummyDataForProgramRegistryStatusHistory = [
  {
    id: '1',
    registrationStatus: 'active',
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

const dummyApi = {
  get: async (endpoint, options) => {
    await sleep(5000);
    const sortedData =
      options.order && options.orderBy
        ? dummyDataForProgramRegistryStatusHistory.sort(
            ({ [options.orderBy]: a }, { [options.orderBy]: b }) => {
              if (typeof a === 'string') {
                return options.order === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
              }
              return options.order === 'asc' ? a - b : b - a;
            },
          )
        : sortedData;
    const startIndex = options.page * options.rowsPerPage || 0;
    const endIndex = startIndex + options.rowsPerPage ? options.rowsPerPage : sortedData.length;
    return {
      data: sortedData.slice(startIndex, endIndex),
      count: dummyDataForProgramRegistryStatusHistory.length,
    };
  },
};
storiesOf('Program Registry', module).add('ProgramRegistryStatusHistory removed never', () => (
  <ApiContext.Provider value={dummyApi}>
    <ProgramRegistryStatusHistory
      programRegistry={{
        id: '23242234234',
      }}
    />
  </ApiContext.Provider>
));

storiesOf('Program Registry', module).add('ProgramRegistryStatusHistory removed once', () => (
  <ApiContext.Provider value={dummyApi}>
    <ProgramRegistryStatusHistory
      programRegistry={{
        id: '23242234234',
      }}
    />
  </ApiContext.Provider>
));

//#endregion ProgramRegistryStatusHistory

//#region InfoPaneList
const dummyProgramRegistriesForInfoPaneList = [
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
const dummyApiForInfoPaneList = {
  get: async endpoint => {
    await sleep(1000);
    return {
      data: dummyProgramRegistriesForInfoPaneList,
    };
  },
};
storiesOf('Program Registry', module).add('ProgramRegistry Info Panlist', () => {
  const patient = { id: '323r2r234r' };
  return (
    <MockedApi endpoints={mockProgramRegistrytFormEndpoints}>
      <ApiContext.Provider value={dummyApiForInfoPaneList}>
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
          />
        </div>
      </ApiContext.Provider>
    </MockedApi>
  );
});
//#endregion InfoPaneList

//#region DisplayPatientRegDetails
storiesOf('Program Registry', module).add('DisplayPatientRegDetails Low risk', () => (
  <div style={{ width: '797px' }}>
    <DisplayPatientRegDetails
      patientProgramRegistration={{
        date: '2023-08-28T02:40:16.237Z',
        programRegistryClinicalStatusId: '123123',
        programRegistryClinicalStatus: {
          id: '123123',
          code: 'low_risk',
          name: 'Low risk',
          color: 'green',
        },
        clinicianId: '213123',
        clinician: {
          id: '213123',
          displayName: 'Alaister',
        },
        registrationStatus: 'active',
      }}
    />
  </div>
));

storiesOf('Program Registry', module).add('DisplayPatientRegDetails Critical', () => (
  <div style={{ width: '797px' }}>
    <DisplayPatientRegDetails
      patientProgramRegistration={{
        date: '2023-08-28T02:40:16.237Z',
        programRegistryClinicalStatusId: '123123',
        programRegistryClinicalStatus: {
          id: '123123',
          code: 'critical',
          name: 'Critical',
          color: 'red',
        },
        clinicianId: '213123',
        clinician: {
          id: '213123',
          displayName: 'Alaister',
        },
        removedById: '213123',
        removedBy: {
          id: '213123',
          displayName: 'Alaister',
        },
        registrationStatus: 'removed',
      }}
    />
  </div>
));

storiesOf('Program Registry', module).add('DisplayPatientRegDetails Needs review', () => (
  <div style={{ width: '797px' }}>
    <DisplayPatientRegDetails
      patientProgramRegistration={{
        date: '2023-08-28T02:40:16.237Z',
        programRegistryClinicalStatusId: '123123',
        programRegistryClinicalStatus: {
          id: '123123',
          code: 'needs_review',
          name: 'Needs review',
          color: 'yellow',
        },
        clinicianId: '213123',
        clinician: {
          id: '213123',
          displayName: 'Alaister',
        },
        removedById: '213123',
        removedBy: {
          id: '213123',
          displayName: 'Alaister',
        },
        registrationStatus: 'removed',
      }}
    />
  </div>
));
//#endregion DisplayPatientRegDetails
