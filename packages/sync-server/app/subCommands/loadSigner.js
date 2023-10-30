import { promises as fs } from 'fs';
import { format } from 'date-fns';
import { Command } from 'commander';

import { log } from 'shared/services/logging';
import { Signer } from 'shared/models';
import { SettingsReader } from '@tamanu/settings';

import { loadCertificateIntoSigner } from '../integrations/Signer';
import { initDatabase } from '../database';

async function loadSigner({ signerCertificate }) {
  const { store } = await initDatabase({ testMode: false });
  const settings = new SettingsReader(store.models);

  const signerFile = await fs.readFile(signerCertificate, 'utf8');
  const signerData = await loadCertificateIntoSigner(signerFile, {}, { settings });

  const pending = await Signer.findPending();

  if (!pending) {
    throw new Error('No pending signer, did you do this already?');
  }

  await pending.update(signerData);
  const start = format(signerData.workingPeriodStart, 'yyyy-MM-dd');
  const end = format(signerData.workingPeriodEnd, 'yyyy-MM-dd');
  log.info(`Loaded Signer (${start} - ${end})`);

  process.exit(0);
}

export const loadSignerCommand = new Command('loadSigner')
  .description('Loads an ICAO signer certificate into Tamanu')
  .requiredOption('-s, --signer-certificate <path>', 'Path to the signer certificate')
  .action(loadSigner);
