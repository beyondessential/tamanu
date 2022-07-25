import { Command } from 'commander';
import { uniq, pick } from 'lodash';

import { initDatabase, closeDatabase } from '../../../database';
// TODO (TAN-1529): import this from the spreadsheet once possible
import { seed } from '../chance';
import { loopAndGenerate } from '../loopAndGenerate';
import { STEPS } from './steps';

const generateFiji = async ({ patientCount: patientCountStr }) => {
  const patientCount = Number.parseInt(patientCountStr, 10);
  const store = await initDatabase({ testMode: false });

  // determine which steps to run
  const perPatientSteps = STEPS.PER_PATIENT; // TODO: allow specifying which steps
  const perPatientStepValues = Object.values(perPatientSteps); // avoid using Object.entries() in loop
  const requiredSetup = uniq([...perPatientStepValues, STEPS.PATIENT].flatMap(s => s.setup));
  const setupSteps = pick(STEPS.SETUP, requiredSetup);

  // helper to run required SETUP steps
  const upsertSetupData = async () => {
g    const data = {};
    for (const [name, step] of Object.entries(setupSteps)) {
      data[name] = await step.run(store);
    }
    return data;
  };

  // helper to run requested PER_PATIENT steps
  const insertPatientData = async setupData => {
    const patient = await STEPS.PATIENT.run(store, setupData);
    for (const step of perPatientStepValues) {
      await step.run(store, setupData, patient.id);
    }
  };

  // perform the generation
  process.stdout.write(`Generating data (seed=${seed})...\n`);
  process.stdout.write(`Setup steps      : ${Object.keys(setupSteps).join(',')}\n`);
  process.stdout.write(`Per-patient steps: ${Object.keys(perPatientSteps).join(',')}\n`);
  try {
    const setupData = await upsertSetupData();
    await loopAndGenerate(store, patientCount, () => insertPatientData(setupData));
  } finally {
    await closeDatabase();
  }
};

export const fijiCommand = new Command('fiji')
  .description('Generate fake data with the same rough structure as Fiji')
  .option('-p, --patientCount <number>', 'number of patients to generate', 10000)
  .action(generateFiji);
