import config from 'config';
import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';
import { Op } from 'sequelize';

export class VdsNcDocumentSigningProcessor extends ScheduledTask {
  constructor(context) {
    const config = config.schedules.vds.documentSigningProcessor;
    super(config.schedule, log);
    this.config = config;
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
      limit: this.config.limit,
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

    return Promise.all(docs.map(doc => doc.sign(vdsConfig().keySecret)));
  }
}
