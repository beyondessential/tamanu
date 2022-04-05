import { Command } from 'commander';
import { v4 as uuidv4 } from 'uuid';
import Chance from 'chance';

import { fake } from 'shared/test-helpers';

import { initDatabase, closeDatabase } from '../database';

const chance = new Chance();

const REPORT_INTERVAL_MS = 100;
const NUM_VILLAGES = 50;

const generateFiji = async ({ patientCount }) => {
  const store = await initDatabase({ testMode: false });
  const { Patient, ReferenceData } = store.models;

  const setupData = {
    villageIds: [],
  };
  const upsertSetupData = async () => {
    // villages
    for (let i = 0; i < NUM_VILLAGES; i++) {
      const name = chance.name();
      const code = name.toLowerCase();
      const id = `village-${code}-${uuidv4()}`;
      await ReferenceData.create({ id, code, name, type: 'village' });
      setupData.villageIds.push(id);
    }
  };

  const insertPatientData = async () => {
    await Patient.create({
      ...fake(Patient),
      villageId: chance.pickone(setupData.villageIds),
    });
  };

  let intervalId;
  try {
    let i = 0;

    const reportProgress = () => {
      // \r works because the length of this is guaranteed to always grow longer or stay the same
      process.stdout.write(`Generating patient ${i}/${patientCount}...\r`);
    };

    // perform the generation
    await store.sequelize.transaction(async () => {
      process.stdout.write('Upserting setup data...\n');
      await upsertSetupData();

      // report progress regularly but don't spam the console
      intervalId = setInterval(reportProgress, REPORT_INTERVAL_MS);
      reportProgress();

      // generate patients
      for (i = 0; i < patientCount; i++) {
        await insertPatientData();
      }

      // finish up
      clearInterval(intervalId);
      reportProgress();
      process.stdout.write('\nCommitting transaction...\n');
    });
    process.stdout.write('Complete\n');
  } finally {
    clearInterval(intervalId);
    await closeDatabase();
  }
};

export const generateCommand = new Command('generate').description('Generate fake data');

generateCommand
  .command('fiji')
  .description('Generate fake data with the same rough structure as Fiji')
  .option('-p, --patientCount <number>', 'number of patients to generate', 10000)
  .action(generateFiji);
