import config from 'config';
import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';
import qrcode from 'qrcode';
import { Op } from 'sequelize';

export class VdsNcSignatureRequestProcessor extends ScheduledTask {
  constructor(context) {
    super('*/5 * * * *', log);
    this.context = context;
  }

  getName() {
    return 'VdsNcSignatureRequestProcessor';
  }

  async run() {
    const { VdsNcSignature, VdsNcSigner } = this.context.store.models;
    const requests = await VdsNcSignature.findAll({
      where: {
        signedAt: { [Op.is]: null },
      },
    });

    if (requests.length < 1) {
      log.info('No pending VDS-NC signature requests');
      return Promise.resolve();
    }

    try {
      await VdsNcSigner.findActive();
    } catch (err) {
      log.error(`No active VDS-NC signer found, cannot proceed. (${err})`);
      return Promise.resolve();
    }

    return Promise.all(
      requests.map(async request => {
        const signed = await request.signRequest(config.icao.keySecret);

        if (signed.recipientEmail) {
          const vds = await signed.intoVDS();
          const qrCode = qrcode.toDataURL(JSON.stringify(vds), { errorCorrectionLevel: 'H' });
          // TODO: generate doc, embed QR, and send email
        }
      }),
    );
  }
}
