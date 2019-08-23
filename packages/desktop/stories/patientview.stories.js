import React from 'react';

import { storiesOf } from '@storybook/react';

import { PatientInfoPane } from '../app/components/PatientInfoPane';
import { InfoPaneList } from '../app/components/InfoPaneList';

import { createDummyPatient } from './dummyPatient';

storiesOf('PatientInfoPane', module).add('Default', () => (
  <PatientInfoPane patient={createDummyPatient()} />
));

const items = ['Peanuts', 'Sheep'];
storiesOf('PatientInfoPaneList', module).add('Default', () => (
  <InfoPaneList title="Allergies" items={items} />
));
