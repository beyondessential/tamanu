import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { DeleteProgramRegistry } from '../app/views/programRegistry/DeleteProgramRegistry';

storiesOf('Program Registry', module).add('ProgramRegistry Status Cahnge', () => {
  return <DeleteProgramRegistry onSubmit={action('submit')} onCancel={action('cancel')} />;
});
