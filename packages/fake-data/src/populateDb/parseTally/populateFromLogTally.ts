import { times } from 'lodash';
import { createEncounter, createPatient, createRepeatingAppointment } from './populateDb';
import { Models } from '@tamanu/database';

const MODEL_TO_FUNCTION = {
  Appointment: { POST: createRepeatingAppointment, PUT: () => null },
  Patient: { POST: createPatient, PUT: () => null },
  Encounter: { POST: createEncounter, PUT: () => null },
};

// Read and parse the file

const exampleFile = {
  Patient: {
    POST: 10,
    PUT: 10,
  },
  Encounter: {
    POST: 10,
    PUT: 10,
  },
};

// Create/get db instance

// Generate import data

// Loop through the file and map to functions

export const populateDbFromTallyFile = (tallyFile: object, models: Models) => {
  Object.entries(tallyFile).forEach(([model, tally]) => {
    times(tally.POST, () => MODEL_TO_FUNCTION[model].POST({ models }));
    times(tally.PUT, () => MODEL_TO_FUNCTION[model].PUT({ models }));
  });
};
