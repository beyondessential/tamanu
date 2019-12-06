import React from 'react';

import { storiesOf } from '@storybook/react';

import { createDummyPatient } from 'Shared/demoData';

import { InfoPaneList } from '../app/components/InfoPaneList';

const items = ['Peanuts', 'Sheep'];
storiesOf('PatientInfoPaneList', module).add('Default', () => (
  <InfoPaneList title="Allergies" items={items} />
));
