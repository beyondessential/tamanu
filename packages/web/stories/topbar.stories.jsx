import React from 'react';
import { action } from '@storybook/addon-actions';
import { Button, EncounterTopBar, TopBar } from '../app/components';

export default {
  title: 'TopBar',
  component: TopBar,
};

export const WithTitle = {
  render: () => <TopBar title="Patient listing" />,
};

export const WithButton = {
  render: () => (
    <TopBar title="Lab requests">
      <Button color="primary" variant="contained" onClick={action('save')}>
        Save
      </Button>
    </TopBar>
  ),
};

export const WithSubtitle = {
  render: () => (
    <TopBar title="Hospital Admission" subTitle="Etta Clinic">
      <Button color="primary" variant="contained" onClick={action('save')}>
        Save
      </Button>
    </TopBar>
  ),
};

export const EncounterTopBarStory = {
  render: () => (
    <EncounterTopBar
      title="Hospital Admission"
      subTitle="Etta Clinic"
      encounter={{ startDate: '10/01/2021', examiner: { displayName: 'Tom Hanks' } }}
    >
      <Button color="primary" variant="contained" onClick={() => {}}>
        Discharge
      </Button>
    </EncounterTopBar>
  ),
};
