import config from 'config';
import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';
import { Op, Sequelize } from 'sequelize';

export class VdsNcSignerEndOfWorkingPeriodChecker extends ScheduledTask {
  constructor(context) {
    const conf = config.schedules.vds.signerEndOfWorkingPeriodChecker;
    super(conf.schedule, log);
    this.config = conf;
    this.context = context;
  }

  getName() {
    return 'VdsNcSignerEndOfWorkingPeriodChecker';
  }

  async run() {
    const { VdsNcSigner } = this.context.store.models;
    const expired = await VdsNcSigner.findAll({
      where: {
        workingPeriodEnd: { [Op.lt]: Sequelize.NOW },
      },
      // hard limit: there really should only ever be zero or one
      // expired signers at any given time, but just in case:
      limit: 5,
    });

    if (!expired.length) {
      return Promise.resolve();
    }

    log.info(`${expired.length} VDS-NC signer(s) have reached the end of their working period`);

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
