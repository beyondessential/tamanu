import { Op, Sequelize } from 'sequelize';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

export class SignerWorkingPeriodChecker extends ScheduledTask {
  constructor({ store, schedules }) {
    const { jitterTime, schedule } = schedule.signerWorkingPeriodChecker;
    super(schedules, log, jitterTime);
    this.models = store.models;
  }

  getName() {
    return 'SignerWorkingPeriodChecker';
  }

  async run() {
    const { Signer } = this.models;
    const expired = await Signer.findAll({
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
