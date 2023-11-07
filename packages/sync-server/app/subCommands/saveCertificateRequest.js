import { Command } from 'commander';
import { promises as fs } from 'fs';
import { log } from '@tamanu/shared/services/logging';

import { Signer } from '@tamanu/shared/models';

import { initDatabase } from '../database';

async function saveCertificateRequest({ output }) {
  log.info(`Writing certificate request to ${output}`);

  await initDatabase({ testMode: false });

  const pending = await Signer.findPending();

  if (!pending) {
    throw new Error('No signers found with pending certificate requests');
  }

  await fs.writeFile(output, pending.request);
}

export const saveCertificateRequestCommand = new Command('saveCertificateRequest')
  .description('Fetches the latest certificate request without a matching certificate')
  .requiredOption('-o, --output <file>', 'Output filepath')
  .action(saveCertificateRequest);
