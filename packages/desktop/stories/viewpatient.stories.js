import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { PatientView } from '../app/views/PatientView';

import { createDummyPatient, createDummyVisit } from './dummyPatient';

storiesOf('PatientView', module)
  .add('With visit', () => (
    <PatientView
      patient={createDummyPatient({
        visits: [createDummyVisit(true), createDummyVisit(false), createDummyVisit(false)],
      })}
    />
  ))
  .add('With no visit', () => <PatientView patient={createDummyPatient({})} />)
  .add('With alerts', () => (
    <PatientView
      patient={createDummyPatient({
        alerts: [
          'The patient has shown violent tendencies',
          'The patient has multiple criminal convictions',
        ],
      })}
    />
  ));
