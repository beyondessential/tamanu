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

    const signer = await VdsNcSigner.findActive();

    let beyondThreshold = false;
    
    // If this is the first signer
    if (!signer) {
      beyondThreshold = true;
    } else {
      // If we've let it lapse entirely
      if (signer.validityPeriodEnd <= new Date()) {
        beyondThreshold = true;
      }
      
      // If we're really too late somehow
      if (signer.workingPeriodEnd <= new Date()) {
        beyondThreshold = true;
      }
      
      // Buffer before PKUP ends
      const daysUntilWorkingEnd = (signer.workingPeriodEnd - new Date()) / (1000 * 60 * 60 * 24);
      if (daysUntilWorkingEnd >= 16) {
        beyondThreshold = true;
      }
    }

    if (beyondThreshold) {
      if (signer) {
        log.info(`Signer ${signer.id} is beyond renewal threshold`);
      } else {
        log.info(`Generating CSR for first Signer`);
      }

      log.info('Generating new signer CSR');
      const { publicKey, privateKey, request } = await newKeypairAndCsr();
      const newSigner = await VdsNcSigner.create({
        publicKey: Buffer.from(publicKey),
        privateKey: Buffer.from(privateKey),
        request,
        countryCode: vdsConf.sign.countryCode3,
      });
      log.info(`Created new signer (CSR): ${newSigner.id}`);
    }
  }
}
