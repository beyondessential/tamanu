import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Button } from '@tamanu/ui-components';
import { EncounterTopBar, TopBar } from '../app/components';

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
  ))
  .add('Encounter Top Bar', () => (
    <EncounterTopBar
      title="Hospital Admission"
      subTitle="Etta Clinic"
      encounter={{ startDate: '10/01/2021', examiner: { displayName: 'Tom Hanks' } }}
    >
      <Button color="primary" variant="contained" onClick={() => {}}>
        Discharge
      </Button>
    </EncounterTopBar>
  ));
