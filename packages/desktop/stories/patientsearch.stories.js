import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { PatientSearch } from '../app/components/PatientSearch';

import { createDummyPatient } from './dummyPatient';

const patients = new Array(400).fill(0).map(() => createDummyPatient());

const suggester = {
  fetchSuggestions: async search => {
    const s = search.toLowerCase();
    return patients.filter(x => x.name.toLowerCase().includes(s)).slice(0, 10);
  },
};

storiesOf('PatientSearch', module).add('Default', () => (
  <PatientSearch suggester={suggester} onPatientSelect={action('patientSelect')} />
));
