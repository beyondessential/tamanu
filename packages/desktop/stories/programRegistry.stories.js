import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { ApiContext } from '../app/api';
import { MockedApi } from './utils/mockedApi';
import { Modal } from '../app/components/Modal';
import { InfoPaneList } from '../app/components/PatientInfoPane/InfoPaneList';
import { ProgramRegistryForm } from '../app/views/programRegistry/ProgramRegistryForm';
import { ProgramRegistryListItem } from '../app/views/programRegistry/ProgramRegistryListItem';
import { PROGRAM_REGISTRY } from '../app/components/PatientInfoPane/paneTitles';

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

const dummyProgramRegistries = [
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

function sleep(milliseconds) {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}
const dummyApi = {
  get: async endpoint => {
    await sleep(1000);
    return {
      data: dummyProgramRegistries,
    };
  },
};
storiesOf('Program Registry', module).add('ProgramRegistry Info Panlist', () => {
  const patient = { id: '323r2r234r' };
  return (
    <MockedApi endpoints={mockProgramRegistrytFormEndpoints}>
      <ApiContext.Provider value={dummyApi}>
        <div style={{ width: '250px', backgroundColor: 'white', padding: '10px' }}>
          <InfoPaneList
            patient={patient}
            readonly={false}
            title={PROGRAM_REGISTRY}
            endpoint="programRegistry"
            getEndpoint={`patient/${patient.id}/program-registry`}
            Form={ProgramRegistryForm}
            CustomListItemTemplate={ProgramRegistryListItem}
            getName={programRegistry => programRegistry.name}
            behavior="modal"
            itemTitle="Add program registry"
            getEditFormName={programRegistry => `Program registry: ${programRegistry.name}`}
            customListModifierFunc={list => {
              if (!list) return list;
              return list.sort((a, b) => {
                if (a.status < b.status) {
                  return -1;
                }
                if (a.status > b.status) {
                  return 1;
                }

                if (a.clinicalStatus < b.clinicalStatus) {
                  return -1;
                }
                if (a.clinicalStatus > b.clinicalStatus) {
                  return 1;
                }
                return 0;
              });
            }}
          />
        </div>
      </ApiContext.Provider>
    </MockedApi>
  );
});
