import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import Chance from 'chance';
import { PatientSearch } from '../app/components/PatientSearch';

const generator = new Chance();

function fakePatient(i) {
  const gender = Math.random() < 0.5 ? 'male' : 'female';
  return {
    _id: `patient-${i}`,
    name: generator.name({ gender }),
    sex: gender,
    dateOfBirth: generator.birthday(),
  };
}

const patients = new Array(400).fill(0).map((x, i) => fakePatient(i));

const suggester = {
  fetchSuggestions: async search => {
    const s = search.toLowerCase();
    return patients.filter(x => x.name.toLowerCase().includes(s)).slice(0, 10);
  },
};

storiesOf('PatientSearch', module).add('Default', () => (
  <PatientSearch suggester={suggester} onPatientSelect={action('patientSelect')} />
));
