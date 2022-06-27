import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { TopBar, Button } from '../app/components';

storiesOf('TopBar', module)
  .add('With title', () => <TopBar title="Patient listing" />)
  .add('With button', () => (
    <TopBar title="Lab requests">
      <Button color="primary" variant="contained" onClick={action('save')}>
        Save
      </Button>
    </TopBar>
  ))
  .add('With subtitle', () => (
    <TopBar title="Hospital Admission" subTitle="Etta Clinic">
      <Button color="primary" variant="contained" onClick={action('save')}>
        Save
      </Button>
    </TopBar>
  ));
