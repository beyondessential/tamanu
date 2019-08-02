import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { PatientSearch } from '../app/components/PatientSearch';

const firstNames = `
  Alan Brenda Charlie Diego Eunice Frank Giorno Harriet Ingrid Jotaro Klaus 
  Leon Marisha Nico Olivia Prue Quincy Richard Sasha Theo Ursula Victoria 
  Wendy Xavier Yolande Zack
`.split(/\s/g).map(x => x.trim()).filter(x=>x);

const surnames = `
  Alda Berenstain Cooper Dunwich Escobar Finch Giovanna Humperdinck Ishii 
  Jackson Kepler Lang Morrison Newton Onassis Pemberton Quagmire Roper
  Smith Tucker Usher Vandermeer Winslow Xi Yearwood Zambrero
`.split(/\s/g).map(x => x.trim()).filter(x=>x);

const pick = (arr) => {
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx];
};

const patients = (new Array(200)).fill(0).map((x, i) => ({
  _id: `patient-${i}`,
  name: `${pick(firstNames)} ${pick(surnames)}`,
  sex: pick(['male', 'female']),
  age: 4 + Math.floor(Math.random() * 80),
}));

const suggester = {
  fetchSuggestions: async (search) => {
    const s = search.toLowerCase();
    return patients.filter(x => x.name.toLowerCase().includes(s)).slice(0, 10);
  }
};

storiesOf('PatientSearch', module)
  .add('Default', () => (
    <PatientSearch
      suggester={suggester}
      onPatientSelect={action("patientSelect")}
    />
  ));
