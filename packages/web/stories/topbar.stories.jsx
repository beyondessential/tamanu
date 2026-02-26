import React from 'react';
import { action } from 'storybook/actions';
import { Button } from '@tamanu/ui-components';
import { EncounterTopBar, TopBar } from '../app/components';

export default {
  title: 'TopBar',
};

export const WithTitle = () => <TopBar title="Patient listing" />;

WithTitle.story = {
  name: 'With title',
};

export const WithButton = () => (
  <TopBar title="Lab requests">
    <Button color="primary" variant="contained" onClick={action('save')}>
      Save
    </Button>
  </TopBar>
);

WithButton.story = {
  name: 'With button',
};

export const WithSubtitle = () => (
  <TopBar title="Hospital Admission" subTitle="Etta Clinic">
    <Button color="primary" variant="contained" onClick={action('save')}>
      Save
    </Button>
  </TopBar>
);

WithSubtitle.story = {
  name: 'With subtitle',
};

export const EncounterTopBarStory = () => (
  <EncounterTopBar
    title="Hospital Admission"
    subTitle="Etta Clinic"
    encounter={{ startDate: '10/01/2021', examiner: { displayName: 'Tom Hanks' } }}
  >
    <Button color="primary" variant="contained" onClick={() => {}}>
      Discharge
    </Button>
  </EncounterTopBar>
);

EncounterTopBarStory.story = {
  name: 'Encounter top bar',
};
