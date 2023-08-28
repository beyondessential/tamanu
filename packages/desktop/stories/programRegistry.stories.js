import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Modal } from '../app/components/Modal';
import { MockedApi } from './utils/mockedApi';

import { ProgramRegistryForm } from '../app/views/programRegistry/ProgramRegistryForm';

const mockProgramRegistrytFormEndpoints = {
  'suggestions/programRegistry': () => [
    { id: '1', name: 'Arm' },
    { id: '2', name: 'Leg' },
    { id: '3', name: 'Shoulder' },
  ],
  'suggestions/registeringFacility': () => [
    { id: '1', name: 'Hospital 1' },
    { id: '2', name: 'Hospital 2' },
  ],
  'suggestions/registeredBy': () => [
    { id: '1', name: 'Normal' },
    { id: '2', name: 'Urgent' },
  ],
  'suggestions/programRegistryStatus': () => [
    { id: '1', name: 'Pending' },
    { id: '2', name: 'Inprogress' },
    { id: '3', name: 'Complete' },
  ],
};

storiesOf('Program Registry', module).add('ProgramRegistryFrom', () => (
  <MockedApi endpoints={mockProgramRegistrytFormEndpoints}>
    <Modal width="md" title="Add program registry" open>
      <ProgramRegistryForm onSubmit={action('submit')} onCancel={action('cancel')} />
    </Modal>
  </MockedApi>
));
