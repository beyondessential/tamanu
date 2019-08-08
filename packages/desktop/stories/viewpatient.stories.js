import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { PatientView } from '../app/views/PatientView';

import { createDummyPatient } from './dummyPatient';

storiesOf('PatientView', module)
  .add('With visit', () => (
    <PatientView patient={createDummyPatient({
      visits: [
        { name: 1 },
      ],
    })}/>
  ))
  .add('With no visit', () => (
    <PatientView patient={createDummyPatient({
    })}/>
  ))
  .add('With alerts', () => (
    <PatientView patient={createDummyPatient({
      alerts: [
        "The patient has shown violent tendencies",
        "The patient has multiple criminal convictions",
      ],
    })}/>
  ))
