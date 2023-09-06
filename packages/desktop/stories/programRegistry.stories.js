import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { ChangeStatusFormModal } from '../app/views/programRegistry/ChangeStatusFormModal';
import { MockedApi } from './utils/mockedApi';

const mockProgramRegistrytFormEndpoints = {
  'suggestions/programRegistryClinicalStatus': () => [
    { id: '1', name: 'current' },
    { id: '2', name: 'historical' },
    { id: '3', name: 'merged' },
  ],
};

storiesOf('Program Registry', module).add('ProgramRegistry Status Cahnge', () => {
  return (
    <MockedApi endpoints={mockProgramRegistrytFormEndpoints}>
      <ChangeStatusFormModal
        onSubmit={action('submit')}
        onCancel={action('cancel')}
        program={{ id: '3e2r23r23r', programRegistryClinicalStatusId: '1' }}
        patient={{ id: '3e2r23r23r' }}
      />
    </MockedApi>
  );
});
