import config from 'config';
import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';
import { Op } from 'sequelize';
import { newKeypairAndCsr, vdsConfig } from '../integrations/VdsNc';

export class VdsNcSignerRenewalChecker extends ScheduledTask {
  constructor(context) {
    const conf = config.schedules.vds.signerRenewalChecker;
    super(conf.schedule, log);
    this.config = conf;
    this.context = context;
  }

  getName() {
    return 'VdsNcSignerRenewalChecker';
  }

  async run() {
    const { VdsNcSigner } = this.context.store.models;
    const vdsConf = vdsConfig();
    const signer = await VdsNcSigner.findActive();

    let beyondThreshold = false;

    // Buffer before expiration
    if (vdsConf.renew.daysBeforeExpiry) {
      const daysUntilExpiry = (signer.notAfter - new Date()) / (1000 * 60 * 60 * 24);
      if (daysUntilExpiry >= vdsConf.renew.daysBeforeExpiry) {
        beyondThreshold = true;
      }
    }

    // Signature issuance limit (with buffer)
    if (vdsConf.renew.maxSignatures) {
      let maxSigs;
      if (vdsConf.renew.softMaxSignatures) {
        maxSigs = Math.min(vdsConf.renew.maxSignatures, vdsConf.renew.softMaxSignatures);
      } else {
        maxSigs = Math.floor(vdsConf.renew.maxSignatures * 0.9);
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
          requestSentAt: { [Op.is]: null },
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
      const { publicKey, privateKey, request } = await newKeypairAndCsr();
      const newSigner = await VdsNcSigner.create({
        publicKey,
        privateKey,
        request,
        countryCode: vdsConf.sign.countryCode3,
      });
      log.info(`Created new signer (CSR): ${newSigner.id}`);
    }
  }
}
