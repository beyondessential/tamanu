import { Command } from 'commander';
import { uniq, pick } from 'lodash';
import { UniqueConstraintError } from 'sequelize';

import { initDatabase, closeDatabase } from '../../../database';
import { seed } from '../chance';
import { loopAndGenerate } from '../loopAndGenerate';
import { STEPS } from './steps';

const POSSIBLE_STEPS = Object.keys(STEPS.PER_PATIENT);
const MAX_CONSECUTIVE_UNIQUE_CONSTRAINT_ERRORS = 100; // very unlikely to happen 100 times in a row

export const generateFiji = async ({ patientCount: patientCountStr, steps: stepsStr }) => {
  const patientCount = Number.parseInt(patientCountStr, 10);
  const store = await initDatabase({ testMode: false });
  const stepNames = stepsStr ? stepsStr.split(',') : POSSIBLE_STEPS;

  // determine which steps to run
  const perPatientSteps = pick(STEPS.PER_PATIENT, stepNames); // TODO: allow specifying which steps
  const perPatientStepValues = Object.values(perPatientSteps); // avoid using Object.entries() in loop
  const requiredSetup = uniq([...perPatientStepValues, STEPS.PATIENT].flatMap(s => s.setup));
  const setupSteps = pick(STEPS.SETUP, requiredSetup);

  // helper to run required SETUP steps
  const upsertSetupData = async () => {
    const data = {};
    for (const [name, step] of Object.entries(setupSteps)) {
      data[name] = await step.run(store);
    }
    return data;
  };

  // helper to run requested PER_PATIENT steps
  const insertPatientData = async setupData => {
    let patient;
    // avoid creating a function inside the loop
    const doWork = async () => {
      patient = await STEPS.PATIENT.run(store, setupData);
      for (const step of perPatientStepValues) {
        await step.run(store, setupData, patient.id);
      }
    };
    for (let i = 0; i < MAX_CONSECUTIVE_UNIQUE_CONSTRAINT_ERRORS; i++) {
      try {
        await store.sequelize.transaction(doWork);
        return;
      } catch (e) {
        if (!(e instanceof UniqueConstraintError)) {
          throw e;
        }
      }
    }
    throw new Error(
      `exceeded ${MAX_CONSECUTIVE_UNIQUE_CONSTRAINT_ERRORS} consecutive unique constraint errors`,
    );
  };

  // perform the generation
  process.stdout.write(`Generating data (seed=${seed})...\n`);
  process.stdout.write(`Selected steps          : ${Object.keys(perPatientSteps).join(',')}\n`);
  process.stdout.write(`Setup for selected steps: ${Object.keys(setupSteps).join(',')}\n`);
  try {
    const setupData = await upsertSetupData();
    await loopAndGenerate(store, patientCount, () => insertPatientData(setupData));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    throw e;
  } finally {
    // don't close database on tests
    if (process.env.NODE_ENV !== 'test') {
      await closeDatabase();
    }
  }
};

export const fijiCommand = new Command('fiji')
  .description('Generate fake data with the same rough structure as Fiji')
  .option('-p, --patientCount <number>', 'number of patients to generate', 10000)
  .option(
    '-s, --steps <comma-separated list>',
    `comma-separated list of steps to run (steps: ${POSSIBLE_STEPS.join(',')})`,
  )
  .action(generateFiji);
