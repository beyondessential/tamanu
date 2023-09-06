import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { MockedApi } from './utils/mockedApi';
import { ActivateProgramRegistryFormModal } from '../app/views/programRegistry/ActivateProgramRegistryFormModal';

const mockProgramRegistrytFormEndpoints = {
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

storiesOf('Program Registry', module).add('ActivateProgramRegistryFormModal', () => (
  <MockedApi endpoints={mockProgramRegistrytFormEndpoints}>
    <ActivateProgramRegistryFormModal
      onSubmit={action('submit')}
      onCancel={action('cancel')}
      patient={{ id: '323r2r234r' }}
      program={{ id: 'asdasdasdasd', programRegistryClinicalStatusId: '2', name: 'Hepatitis B' }}
      open
    />
  </MockedApi>
));
