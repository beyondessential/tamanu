import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { DeleteProgramRegistry } from '../app/views/programRegistry/DeleteProgramRegistry';

storiesOf('Program Registry', module).add('ProgramRegistry Delete Modal', () => {
  return (
    <DeleteProgramRegistry
      program={{ name: 'Hepatitis B' }}
      onSubmit={action('submit')}
      onCancel={action('cancel')}
    />
  );
});
