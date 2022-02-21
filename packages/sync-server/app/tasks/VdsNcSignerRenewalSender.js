import config from 'config';
import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';
import { Op, Sequelize } from 'sequelize';
import moment from 'moment';

export class VdsNcSignerRenewalSender extends ScheduledTask {
  constructor(context) {
    const config = config.schedules.vds.signerRenewalSender;
    super(config.schedule, log);
    this.config = config;
    this.context = context;
  }

  getName() {
    return 'VdsNcSignerRenewalSender';
  }

  async run() {
    const { emailService } = this.context;
    const { VdsNcSigner } = this.context.store.models;

    const pending = await VdsNcSigner.findAll({
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

    const recipient = config.icao.csr.email?.recipient;
    if (!recipient) {
      log.error('No CSR recipient configured, check config.icao.csr.email.recipient!');
      return;
    }

    log.info(`Emailing ${pending.length} CSR(s) to ${recipient}`);
    for (const signer of pending) {
      try {
        await emailService.sendEmail({
          to: recipient,
          from: config.mailgun.from,
          subject: config.icao.csr.subject,
          content: config.icao.csr.body,
          attachment: {
            filename: `Tamanu_${moment(signer.createdAt).format('YYYY-MM-DD')}.csr`,
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
