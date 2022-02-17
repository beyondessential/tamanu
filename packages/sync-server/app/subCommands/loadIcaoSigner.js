import { promises as fs } from 'fs';
import { Op } from 'sequelize';
import moment from 'moment';

import { log } from 'shared/services/logging';
import { VdsNcSigner } from 'shared/models';

import { loadCertificateIntoSigner } from '../integrations/VdsNc';
import { initDatabase } from '../database';

export async function loadIcaoSigner(options) {
  await initDatabase({ testMode: false });
  const signerFile = await fs.readFile(options.icaoSigner, 'utf8');
  const signerData = await loadCertificateIntoSigner(signerFile);

  const pending = await VdsNcSigner.findAll({
    where: {
      certificate: { [Op.is]: null },
      privateKey: { [Op.not]: null },
    },
  });

  if (pending.length === 0) {
    throw new Error('No pending signer, did you do this already?');
  }

  if (pending.length > 1) {
    throw new Error('More than one pending signer, you need to fix this manually');
  }

  const pendingSigner = pending[0];
  await pendingSigner.update(signerData);
  log.info(
    `Loaded ICAO Signer (${moment(signerData.notBefore).format('YYYY-MM-DD')} - ${moment(
      signerData.notAfter,
    ).format('YYYY-MM-DD')})`,
  );

  process.exit(0);
}
