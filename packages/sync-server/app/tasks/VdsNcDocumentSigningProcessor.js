import config from 'config';
import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';
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
      return Promise.resolve();
    }

    log.info(`Picked up ${docs.length} unsigned VDS-NC documents.`);

    try {
      await VdsNcSigner.findActive();
    } catch (err) {
      log.error(`No active VDS-NC signer found, cannot proceed. (${err})`);
      return Promise.resolve();
    }

    return Promise.all(docs.map(doc => doc.sign(config.icao.keySecret)));
  }
}
