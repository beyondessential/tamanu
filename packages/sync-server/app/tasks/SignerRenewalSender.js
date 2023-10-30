import { format } from 'date-fns';
import { Op, Sequelize } from 'sequelize';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

export class SignerRenewalSender extends ScheduledTask {
  constructor({ store, settings, schedules, emailService }) {
    super(schedules.signerRenewalSender.schedule, log);
    this.emailService = emailService;
    this.settings = settings;
    this.models = store.models;
  }

  getName() {
    return 'SignerRenewalSender';
  }

  async run() {
    const { Signer } = this.models;

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

    const sender = await this.settings.get('mailgun.from');
    const recipient = await this.settings.get('integrations.signer.sendSignerRequestTo');
    const { subject, body } = await this.settings.get('localisation.templates.signerRenewalEmail');

    log.info(`Emailing ${pending.length} CSR(s) to ${recipient}`);
    for (const signer of pending) {
      try {
        await this.emailService.sendEmail({
          to: recipient,
          from: sender,
          subject,
          text: body,
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
