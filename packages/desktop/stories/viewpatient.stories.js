import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { PatientView } from '../app/views/PatientView';

storiesOf('PatientView', module)
  .add('With visit', () => (
    <PatientView patient={{
      name: 'Ted Francis',
      visits: [
        { name: 1 },
      ],
    }}/>
  ))
  .add('With no visit', () => (
    <PatientView patient={{
      name: 'Jared Smyth',
      visits: [
      ],
    }}/>
  ))
  .add('With alerts', () => (
    <PatientView patient={{
      name: 'Agro Terrorman',
      visits: [],
      alerts: [
        "The patient has shown violent tendencies",
        "The patient has multiple criminal convictions",
      ],
    }}/>
  ))
