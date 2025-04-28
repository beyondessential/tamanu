import { times } from 'lodash';
import { promises as fs } from 'fs';

import { Models } from '@tamanu/database';

import {
  createAdministeredVaccine,
  createDbReport,
  createEncounter,
  createImagingRequest,
  createInvoice,
  createLabRequest,
  createPatient,
  createProgramRegistry,
  createRepeatingAppointment,
  createSurveyResponse,
  createTask,
  generateImportData,
} from '../helpers';

// TODO: this needs way more data groups
const MODEL_TO_FUNCTION = {
  Appointment: { POST: createRepeatingAppointment, PUT: () => null },
  Patient: { POST: createPatient, PUT: () => null },
  Encounter: { POST: createEncounter, PUT: () => null },
  ImagingRequest: { POST: createImagingRequest, PUT: () => null },
  Invoice: { POST: createInvoice, PUT: () => null },
  LabRequest: { POST: createLabRequest, PUT: () => null },
  ProgramRegistry: { POST: createProgramRegistry, PUT: () => null },
  Survey: { POST: createSurveyResponse, PUT: () => null },
  Tasking: { POST: createTask, PUT: () => null },
  Vaccine: { POST: createAdministeredVaccine, PUT: () => null },
  ReportDefinition: { POST: createDbReport, PUT: () => null },
};

export const readJSON = async (path: string): Promise<object> => {
  const data = await fs.readFile(path, 'utf8');
  return JSON.parse(data);
};

// Expects JSON in the format:
// {
//  "<modelName>": {
//      "POST": <requestCount>,
//      "PUT": <requestCount>,
//   },
//  ...
// }
export const populateDbFromTallyFile = async (models: Models, tallyFilePath: string) => {
  await generateImportData(models);

  const tallyJson = await readJSON(tallyFilePath);
  const notInCI = !process.env.CI;

  const calls = Object.entries(tallyJson).flatMap(([model, tally]) => {
    let calls = [];
    const { POST: postCount, PUT: putCount } = tally;
    const { POST: postFn, PUT: putFn } = MODEL_TO_FUNCTION[model] ?? {};

    if (postFn) {
      calls = calls.concat(times(postCount, async () => postFn({ models })));
    } else if (postCount && notInCI) {
      console.error(`Missing mapping for ${model}.POST`);
    }

    if (putFn) {
      calls = calls.concat(times(putCount, async () => putFn({ models })));
    } else if (putCount && notInCI) {
      console.error(`Missing mapping for ${model}.PUT`);
    }

    return calls;
  });

  await Promise.all(calls);
};
