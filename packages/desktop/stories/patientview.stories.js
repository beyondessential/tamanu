import React from 'react';

import { storiesOf } from '@storybook/react';

import { PatientHeader } from '../app/components/PatientHeader';

import { createDummyPatient, createDummyVisit } from './dummyPatient';

storiesOf('PatientHeader', module)
  .add('Default', () => (
    <PatientHeader patient={createDummyPatient()} />
  ))
