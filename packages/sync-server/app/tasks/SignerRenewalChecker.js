import config from 'config';
import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';
import { Op } from 'sequelize';
import { newKeypairAndCsr } from '../integrations/Signer';
import { getLocalisation } from '../localisation';

export class SignerRenewalChecker extends ScheduledTask {
  constructor(context) {
    // TODO: Use db config fetcher (cannot use async on constructor)
    const conf = config.schedules.signerRenewalChecker;
    super(conf.schedule, log);
    this.config = conf;
    this.context = context;
    this.runImmediately();
  }

  getName() {
    return 'SignerRenewalChecker';
  }

  async run() {
    const { Signer } = this.context.store.models;

    const pending = await Signer.findAll({
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

    const signer = await Signer.findActive();

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
      if (daysUntilWorkingEnd <= 16) {
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
      const newSigner = await Signer.create({
        publicKey: Buffer.from(publicKey),
        privateKey: Buffer.from(privateKey),
        request,
        countryCode: (await getLocalisation()).country['alpha-3'],
      });
      log.info(`Created new signer (CSR): ${newSigner.id}`);
    }
  }
}
