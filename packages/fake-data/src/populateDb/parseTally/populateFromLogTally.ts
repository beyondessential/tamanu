import { promises as fs } from 'fs';
import { times } from 'lodash';

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
  Appointment: { POST: createRepeatingAppointment },
  Patient: { POST: createPatient },
  Encounter: { POST: createEncounter },
  ImagingRequest: { POST: createImagingRequest },
  Invoice: { POST: createInvoice },
  LabRequest: { POST: createLabRequest },
  ProgramRegistry: { POST: createProgramRegistry },
  Survey: { POST: createSurveyResponse },
  Tasking: { POST: createTask },
  Vaccine: { POST: createAdministeredVaccine },
  ReportDefinition: { POST: createDbReport },
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
  const { default: pLimit } = await import('p-limit');

  const tallyJson = await readJSON(tallyFilePath);
  const tallies = Object.entries(tallyJson);
  const limit = pLimit(10);
  const limited = (fn: (arg: any) => Promise<any>) =>
    limit(() => fn({ models, limit }).then(print('.'), print('!')));

  for (const [n, [model, tally]] of tallies.entries()) {
    let calls = [];
    const { POST: postCount, PUT: putCount } = tally;
    const { POST: postFn, PUT: putFn } = MODEL_TO_FUNCTION[model] ?? {};

    if (postFn) {
      console.log(`Simulating POST ${model}`, postCount, 'times');
      calls = calls.concat(times(postCount, () => limited(postFn)));
    } else if (postCount) {
      console.error(`Missing mapping for ${model}.POST`);
    }

    if (putFn) {
      console.log(`Simulating PUT ${model}`, postCount, 'times');
      calls = calls.concat(times(putCount, () => limited(putFn)));
    } else if (putCount) {
      console.error(`Missing mapping for ${model}.PUT`);
    }

    if (calls.length > 0) {
      await Promise.all(calls);
      console.log();
      console.log(
        '[',
        n + 1,
        '/',
        tallies.length,
        ']',
        'Simulated',
        calls.length,
        model,
        'endpoint calls',
      );
    }
  }
};

function print(char: string) {
  return () => {
    process.stdout.write(char);
  };
}
