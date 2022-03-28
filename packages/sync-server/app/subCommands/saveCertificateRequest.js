import { Command } from 'commander';
import { promises as fs } from 'fs';
import { log } from 'shared/services/logging';

import { Op } from 'sequelize';
import { Signer } from 'shared/models';

import { initDatabase } from '../database';

async function saveCertificateRequest({ outputPath }) {
  log.info(`Writing certificate request to ${outputPath}`);

  await initDatabase({ testMode: false });

  const latestPending = await Signer.findOne({
    where: {
      certificate: { [Op.is]: null },
    },
    order: [['createdAt', 'DESC']],
  });

  if (!latestPending) {
    throw new Error('No signers found with pending certificate requests');
  }

  await fs.writeFile(outputPath, latestPending.request);
}

export const saveCertificateRequestCommand = new Command('saveCertificateRequest')
  .description('Fetches the latest certificate request without a matching certificate')
  .requiredOption('-o, --output <file>', 'Output filepath')
  .action(saveCertificateRequest);
