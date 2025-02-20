import type { Models, Sequelize } from '@tamanu/database';
import {
  createAppointmentData,
  createDbReportData,
  createEncounterData,
  createFacilityData,
  createImagingRequestData,
  createInvoiceData,
  createLabRequestData,
  createPatientData,
  createProgramData,
  createReferenceData,
  createSurveyData,
  createTaskingData,
  createUserData,
  createVaccineData,
} from 'helpers/linkedDataGenerators';

async function generateAllDataTypes(models: Models) {
  const { referenceData } = await createReferenceData(models);
  const { facility, department, locationGroup, location } = await createFacilityData(models);
  const { user } = await createUserData(models);
  const { patient } = await createPatientData(models, facility.id, user.id);
  const { encounter } = await createEncounterData(
    models,
    patient.id,
    department.id,
    location.id,
    user.id,
    referenceData.id,
  );

  await Promise.all([
    await createLabRequestData(
      models,
      department.id,
      user.id,
      encounter.id,
      referenceData.id,
      patient.id,
    ),
    await createProgramData(models, user.id, patient.id),
    await createSurveyData(models, encounter.id),
    await createDbReportData(models, user.id),
    await createVaccineData(models, referenceData.id, encounter.id),
    await createInvoiceData(models, encounter.id, user.id, referenceData.id),
    await createImagingRequestData(models, user.id, encounter.id, locationGroup.id),
    await createAppointmentData(models, locationGroup.id, patient.id, user.id),
    await createTaskingData(models, encounter.id, user.id, referenceData.id),
  ]);
}

/** Generate fake data to exercise the whole database */
export async function generateFake(sequelize: Sequelize, rounds: number = 1) {
  console.log('Fill database with fake data', rounds, 'rounds');

  let done = 0;
  let errs = 0;
  while (done < rounds && errs < Math.max(10, rounds / 10)) {
    try {
      await generateAllDataTypes(sequelize.models);
      process.stdout.write('.');
      done += 1;
    } catch (err) {
      console.error(err);
      process.stdout.write('!');
      errs += 1;
    }
  }

  if (done < rounds && errs > 0) {
    throw new Error('encountered too many errors');
  }

  console.log();
  await sequelize.close();
}

async function main() {
  const { program } = await import('commander');
  const { default: config } = await import('config');
  const { initDatabase } = require('@tamanu/database/services/database');

  const opts = program
    .option('--rounds <number>', 'How much data to fill database with', '100')
    .requiredOption('--database <string>', 'The database name to connect to')
    .parse()
    .opts();

  const rounds = Math.max(1, parseInt(opts.rounds));

  const db = await initDatabase({
    ...(config as any).db,
    name: opts.database,
  });

  try {
    console.time('done');
    await generateFake(db.sequelize, rounds);
    console.timeEnd('done');
  } finally {
    await db.sequelize.close();
  }
}

if (process.env.NODE_CONFIG_DIR) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
