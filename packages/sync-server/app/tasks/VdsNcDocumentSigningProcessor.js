import config from 'config';
import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';
import qrcode from 'qrcode';
import { Op } from 'sequelize';

export class VdsNcDocumentSigningProcessor extends ScheduledTask {
  constructor(context) {
    super('*/5 * * * *', log);
    this.context = context;
  }

  getName() {
    return 'VdsNcDocumentSigningProcessor';
  }

  async run() {
    const { VdsNcDocument, VdsNcSigner } = this.context.store.models;
    const docs = await VdsNcDocument.findAll({
      where: {
        signedAt: { [Op.is]: null },
      },
    });

    if (docs.length < 1) {
      log.info('No unsigned VDS-NC documents');
      return Promise.resolve();
    }

    try {
      await VdsNcSigner.findActive();
    } catch (err) {
      log.error(`No active VDS-NC signer found, cannot proceed. (${err})`);
      return Promise.resolve();
    }

    return Promise.all(
      docs.map(async doc => {
        const signed = await doc.signRequest(config.icao.keySecret);

        if (signed.recipientEmail) {
          const vds = await signed.intoVDS();
          const qrCode = qrcode.toDataURL(JSON.stringify(vds), { errorCorrectionLevel: 'H' });
          // TODO: generate doc, embed QR, and send email
        }
      }),
    );
  }
}
