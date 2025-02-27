import { times } from 'lodash';
import { promises as fs } from 'fs';

import { Models } from '@tamanu/database';

import {
  createEncounter,
  createPatient,
  createRepeatingAppointment,
  generateImportData,
} from '../helpers';

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

export const readJSON = async (path: string): Promise<object> => {
  const data = await fs.readFile(path, 'utf8');
  return JSON.parse(data);
};

export const populateDbFromTallyFile = async (tallyFilePath: string, models: Models) => {
  // Generate import data
  const {
    referenceData,
    facility,
    department,
    locationGroup,
    location,
    survey,
    scheduledVaccine,
    invoiceProduct,
    labTestType,
    user,
    programRegistry,
  } = await generateImportData(models);

  const tallyJson = await readJSON(tallyFilePath);

  Object.entries(tallyJson).forEach(([model, tally]) => {
    const { POST: postCount, PUT: putCount } = tally;
    const { POST: simulatePost, PUT: simplatePut } = MODEL_TO_FUNCTION[model];

    times(postCount, async () => simulatePost({ models }));
    times(putCount, async () => simplatePut({ models }));
  });
};
