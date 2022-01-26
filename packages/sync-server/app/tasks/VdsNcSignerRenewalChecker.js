import config from 'config';
import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';
import { Op } from 'sequelize';
import { newKeypairAndCsr } from '../utils/vdsCrypto';

export class VdsNcSignerRenewalChecker extends ScheduledTask {
  constructor(context) {
    super('0 0 * * *', log);
    this.context = context;
  }

  getName() {
    return 'VdsNcSignerRenewalChecker';
  }

  async run() {
    const { VdsNcSigner } = this.context.store.models;
    const signer = await VdsNcSigner.findActive();

    let beyondThreshold = false;

    // Buffer before expiration
    if (config.icao.renew.daysBeforeExpiry) {
      const daysUntilExpiry = (signer.notAfter - new Date()) / (1000 * 60 * 60 * 24);
      if (daysUntilExpiry >= config.icao.renew.daysBeforeExpiry) {
        beyondThreshold = true;
      }
    }

    // Signature issuance limit (with buffer)
    if (config.icao.renew.maxSignatures) {
      let maxSigs;
      if (config.icao.renew.softMaxSignatures) {
        maxSigs = Math.min(config.icao.renew.maxSignatures, config.icao.renew.softMaxSignatures);
      } else {
        maxSigs = Math.floor(config.icao.renew.maxSignatures * 0.9);
      }

      if (signer.signaturesIssued >= maxSigs) {
        beyondThreshold = true;
      }
    }

    // If we're really too late somehow
    if (signer.notAfter <= new Date()) {
      beyondThreshold = true;
    }

    if (beyondThreshold) {
      log.info(`Signer ${signer.id} is beyond renewal threshold`);

      const pending = await VdsNcSigner.findAll({
        where: {
          certificate: { [Op.is]: null },
          privateKey: { [Op.not]: null },
        },
      });

      if (pending.length > 0) {
        log.info(
          `There is at least one pending signer CSR: ${pending
            .map(s => s.id)
            .join(', ')}, skipping renewal`,
        );
        return;
      }

      log.info('Generating new signer CSR');
      const {
        publicKey,
        privateKey,
        request,
      } = await newKeypairAndCsr();
      const newSigner = await VdsNcSigner.create({
        publicKey,
        privateKey,
        request,
        countryCode: config.icao.sign.countryCode3,
      });
      log.info(`Created new signer (CSR): ${newSigner.id}`);

      const recipient = config.icao.csr.email?.recipient;
      if (recipient) {
        log.info(`Emailing CSR to ${recipient}`);
        // TODO
      } else {
        log.info('No email recipient configured, skipping email');
      }
    }
  }
}
