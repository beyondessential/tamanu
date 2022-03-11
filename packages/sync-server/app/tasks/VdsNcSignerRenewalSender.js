import config from 'config';
import { Op, Sequelize } from 'sequelize';
import moment from 'moment';
import { get } from 'lodash';

import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';

import { vdsConfig } from '../integrations/VdsNc';
import { getLocalisation } from '../localisation';

export class VdsNcSignerRenewalSender extends ScheduledTask {
  constructor(context) {
    const conf = config.schedules.vds.signerRenewalSender;
    super(conf.schedule, log);
    this.config = conf;
    this.context = context;
  }

  getName() {
    return 'VdsNcSignerRenewalSender';
  }

  async run() {
    const { emailService } = this.context;
    const { VdsNcSigner } = this.context.store.models;
    const vdsConf = vdsConfig();

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

    const localisation = await getLocalisation();

    log.info(`Emailing ${pending.length} CSR(s) to ${vdsConf.csr.email}`);
    for (const signer of pending) {
      try {
        await emailService.sendEmail({
          to: vdsConf.csr.email,
          from: config.mailgun.from,
          subject: get(localisation, 'vdsRenewalEmail.subject'),
          content: get(localisation, 'vdsRenewalEmail.body'),
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
