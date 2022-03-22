import { promises as fs } from 'fs';
import moment from 'moment';
import { Command } from 'commander';

import { log } from 'shared/services/logging';
import { Signer } from 'shared/models';

import { loadCertificateIntoSigner } from '../integrations/Signer';
import { initDatabase } from '../database';

async function loadIcaoSigner({ signerCertificate }) {
  await initDatabase({ testMode: false });
  const signerFile = await fs.readFile(signerCertificate, 'utf8');
  const signerData = await loadCertificateIntoSigner(signerFile);

  const pending = await Signer.findPending();

  if (!pending) {
    throw new Error('No pending signer, did you do this already?');
  }

  const pendingSigner = pending[0];
  await pendingSigner.update(signerData);
  const start = moment(signerData.workingPeriodStart).format('YYYY-MM-DD');
  const end = moment(signerData.workingPeriodEnd).format('YYYY-MM-DD');
  log.info(`Loaded ICAO Signer (${start} - ${end})`);

  process.exit(0);
}

export const loadIcaoSignerCommand = new Command('loadIcaoSigner')
  .description('Loads an ICAO signer certificate into Tamanu')
  .requiredOption('-s, --signer-certificate <path>', 'Path to the signer certificate')
  .action(loadIcaoSigner);
