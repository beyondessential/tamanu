import React from 'react';

import { storiesOf } from '@storybook/react';

import { PatientInfoPane } from '../app/components/PatientInfoPane';

import { createDummyPatient } from './dummyPatient';

storiesOf('PatientInfoPane', module).add('Default', () => (
  <PatientInfoPane patient={createDummyPatient()} />
));
