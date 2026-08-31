import { Command } from 'commander';
import { log } from '@tamanu/shared/services/logging';
import { initDatabase } from '../database';
import { makeVaccineCertificate } from '../utils/makePatientCertificate';
import { ReadSettings } from '@tamanu/settings';

export const generateCertificate = async ({ patientId }) => {
  const store = await initDatabase({ testMode: false });
  const { Patient } = store.models;
  const settings = new ReadSettings(store.models);

  try {
    const patient = await Patient.findByPk(patientId);
    log.info(`Generating vaccine certificate for patient id "${patientId}"`);
    const pdf = await makeVaccineCertificate({
      patient,
      printedBy: 'Admin',
      printedDate: null,
      models: store.models,
      settings,
    });
    log.info(`Certificate output: `, pdf);
  } catch (error) {
    process.stderr.write(`Report failed: ${error.stack}\n`);
    process.exit(1);
  }
  process.exit(0);
};

export const certificateCommand = new Command('generateVaccineCertificate')
  .requiredOption('-p, --patientId <string>')
  .action(generateCertificate);
