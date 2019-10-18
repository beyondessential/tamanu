import React from 'react';

import { storiesOf } from '@storybook/react';

import { createDummyPatient } from 'Shared/demoData';

import { PatientInfoPane } from '../app/components/PatientInfoPane';
import { InfoPaneList } from '../app/components/InfoPaneList';

storiesOf('PatientInfoPane', module).add('Default', () => (
  <PatientInfoPane patient={createDummyPatient()} />
));

const items = ['Peanuts', 'Sheep'];
storiesOf('PatientInfoPaneList', module).add('Default', () => (
  <InfoPaneList title="Allergies" items={items} />
));
