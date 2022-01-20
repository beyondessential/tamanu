import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';
import { Op, Sequelize } from 'sequelize';

export class VdsNcSignerExpiryChecker extends ScheduledTask {
  constructor(context) {
    super('0 1 * * *', log);
    this.context = context;
  }

  getName() {
    return 'VdsNcSignerExpiryChecker';
  }

  async run() {
    const { VdsNcSigner } = this.context.store.models;
    const expired = await VdsNcSigner.findAll({
      where: {
        notAfter: { [Op.lt]: Sequelize.NOW },
      },
    });

    if (!expired.length) {
      return Promise.resolve();
    }

    log.info(`${expired.length} VDS-NC signer(s) expired`);

    return Promise.all(
      expired.map(async signer => {
        signer.set({ privateKey: null });
        await signer.save();
        await signer.destroy();
        log.info(
          `Signer ${signer.id}'s private key deleted (issued ${signer.signaturesIssued} signatures)`,
        );
      }),
    );
  }
}
