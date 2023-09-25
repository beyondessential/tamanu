import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';
import { Op } from 'sequelize';
import { newKeypairAndCsr } from '../integrations/Signer';

export class SignerRenewalChecker extends ScheduledTask {
  constructor(context) {
    const { schedules, settings, store } = context;
    super(schedules.signerRenewalChecker.schedule, log);
    this.settings = settings;
    this.models = store.models;
    this.runImmediately();
  }

  getName() {
    return 'SignerRenewalChecker';
  }

  async run() {
    const { Signer } = this.models;

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
      const signerSettings = await this.settings.get('integrations.signer');
      const country = await this.settings.get('country');
      const { publicKey, privateKey, request } = await newKeypairAndCsr(
        signerSettings,
        country['alpha-2'],
      );
      const newSigner = await Signer.create({
        publicKey: Buffer.from(publicKey),
        privateKey: Buffer.from(privateKey),
        request,
        countryCode: country['alpha-3'],
      });
      log.info(`Created new signer (CSR): ${newSigner.id}`);
    }
  }
}
