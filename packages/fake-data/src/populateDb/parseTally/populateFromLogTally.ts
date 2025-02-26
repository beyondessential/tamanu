import { times } from 'lodash';
import { createEncounter, createPatient, createRepeatingAppointment } from '../helpers';
import { Models } from '@tamanu/database';

// TODO: this needs way more data groups
const MODEL_TO_FUNCTION = {
  Appointment: { POST: createRepeatingAppointment, PUT: () => null },
  Patient: { POST: createPatient, PUT: () => null },
  Encounter: { POST: createEncounter, PUT: () => null },
  ImagingRequest: { POST: () => null, PUT: () => null },
  Invoice: { POST: () => null, PUT: () => null },
  LabRequest: { POST: () => null, PUT: () => null },
  ProgramRegistry: { POST: () => null, PUT: () => null },
  Survey: { POST: () => null, PUT: () => null },
  Tasking: { POST: () => null, PUT: () => null },
  Vaccine: { POST: () => null, PUT: () => null },
  ReportDefinition: { POST: () => null, PUT: () => null },
};

// Read and parse the file

// Create/get db instance

// Generate import data

// Loop through the file and map to functions

export const populateDbFromTallyFile = (tallyFile: object, models: Models) => {
  Object.entries(tallyFile).forEach(([model, tally]) => {
    times(tally.POST, async () => MODEL_TO_FUNCTION[model].POST({ models }));
    times(tally.PUT, async () => MODEL_TO_FUNCTION[model].PUT({ models }));
  });
};
