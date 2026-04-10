import { promises as fs } from 'fs';
import { times } from 'lodash';

import { Models } from '@tamanu/database';

import {
  createAdministeredVaccine,
  createDbReport,
  createEncounter,
  createFacility,
  createImagingRequest,
  createInvoice,
  createLabRequest,
  createMedication,
  createNote,
  createPatient,
  createProcedure,
  createProgramRegistry,
  createRepeatingAppointment,
  createSurveyResponse,
  createTask,
  createTriage,
  generateImportData,
} from '../helpers/index.js';

const MODEL_TO_FUNCTION = {
  Appointment: { POST: createRepeatingAppointment },
  Encounter: { POST: createEncounter },
  Facility: { POST: createFacility },
  ImagingRequest: { POST: createImagingRequest },
  Invoice: { POST: createInvoice },
  LabRequest: { POST: createLabRequest },
  Medication: { POST: createMedication },
  Note: { POST: createNote },
  Patient: { POST: createPatient },
  Procedure: { POST: createProcedure },
  ProgramRegistry: { POST: createProgramRegistry },
  ReportDefinition: { POST: createDbReport },
  Survey: { POST: createSurveyResponse },
  Tasking: { POST: createTask },
  Triage: { POST: createTriage },
  Vaccine: { POST: createAdministeredVaccine },
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
  const limit = pLimit(10);

  const tallyJson = await readJSON(tallyFilePath);
  const tallies = Object.entries(tallyJson);
  const BATCH_SIZE = 50;

  const runBatched = async (fn: (arg: any) => Promise<any>, count: number) => {
    for (let i = 0; i < count; i += BATCH_SIZE) {
      const batchCount = Math.min(BATCH_SIZE, count - i);
      const results = await Promise.allSettled(
        times(batchCount, () =>
          limit(() => fn({ models, limit }).then(print('.'), print('!', true))),
        ),
      );
      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length > batchCount / 2) {
        const firstReason = (failures[0] as PromiseRejectedResult).reason;
        throw new Error(
          `${failures.length}/${batchCount} operations failed in batch: ${firstReason}`,
        );
      }
    }
  };

  for (const [n, [model, tally]] of tallies.entries()) {
    const { POST: postCount, PUT: putCount } = tally;
    const { POST: postFn, PUT: putFn } = MODEL_TO_FUNCTION[model] ?? {};
    let total = 0;

    if (postFn && postCount) {
      console.log(`Simulating POST ${model}`, postCount, 'times');
      await runBatched(postFn, postCount);
      total += postCount;
    } else if (postCount) {
      console.error(`Missing mapping for ${model}.POST`);
    }

    if (putFn && putCount) {
      console.log(`Simulating PUT ${model}`, putCount, 'times');
      await runBatched(putFn, putCount);
      total += putCount;
    } else if (putCount) {
      console.error(`Missing mapping for ${model}.PUT`);
    }

    if (total > 0) {
      console.log();
      console.log(
        '[',
        n + 1,
        '/',
        tallies.length,
        ']',
        'Simulated',
        total,
        model,
        'endpoint calls',
      );
    }
  }
};

function print(char: string) {
  return (value: any) => {
    process.stdout.write(char);
    if (char === '!' && value) {
      console.error(value?.message ?? value);
    }
    return value;
  };
}
