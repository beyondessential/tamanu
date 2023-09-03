import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Modal } from '../app/components/Modal';
import { MockedApi } from './utils/mockedApi';

import { ProgramRegistryForm } from '../app/views/programRegistry/ProgramRegistryForm';

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
  'suggestions/village': () => [
    { id: '1', name: 'Village 1' },
    { id: '2', name: 'Village 2' },
  ],
  'suggestions/practitioner': () => [
    { id: 'test-user-id', name: 'Normal' },
    { id: '2', name: 'Urgent' },
  ],
  'suggestions/programRegistryClinicalStatus': () => [
    { id: '1', name: 'Pending' },
    { id: '2', name: 'Inprogress' },
    { id: '3', name: 'Complete' },
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
