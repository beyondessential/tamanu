import config from 'config';
import { format } from 'date-fns';
import { Op, Sequelize } from 'sequelize';
import { get } from 'lodash';

import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';

import { getLocalisation } from '../localisation';

export class SignerRenewalSender extends ScheduledTask {
  constructor(context) {
    // TODO: Use db config fetcher (cannot use async on constructor)
    const conf = config.schedules.signerRenewalSender;
    super(conf.schedule, log);
    this.config = conf;
    this.context = context;
  }

  getName() {
    return 'SignerRenewalSender';
  }

  async run() {
    const { emailService } = this.context;
    const { Signer } = this.context.store.models;

    const pending = await Signer.findAll({
      where: {
        requestSentAt: { [Op.is]: null },
        certificate: { [Op.is]: null },
        privateKey: { [Op.not]: null },
      },
      // hard limit: there really should only ever be zero or one
      // pending signers at any given time, but just in case:
      limit: 5,
    });

    if (pending.length === 0) return; // nothing to do

    if (pending.length > 1) {
      log.warn(
        `There is more than one pending signer CSR, sending all of them, but this may be a bug: ${pending
          .map(s => s.id)
          .join(', ')}`,
      );
    }

    const localisation = await getLocalisation();

    log.info(
      `Emailing ${pending.length} CSR(s) to ${config.integrations.signer.sendSignerRequestTo}`,
    );
    for (const signer of pending) {
      try {
        await emailService.sendEmail({
          to: config.integrations.signer.sendSignerRequestTo,
          from: config.mailgun.from,
          subject: get(localisation, 'signerRenewalEmail.subject'),
          text: get(localisation, 'signerRenewalEmail.body'),
          attachment: {
            filename: `Tamanu_${format(signer.createdAt, 'yyyy-MM-dd')}.csr`,
            data: Buffer.from(signer.request),
          },
        });
        await signer.update({ requestSentAt: Sequelize.literal('CURRENT_TIMESTAMP') });
      } catch (e) {
        log.error(`Failed to send CSR email: ${e}, will retry in 24h`);
      }
    }
  }
}
