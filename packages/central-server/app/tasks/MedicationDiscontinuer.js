import config from 'config';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { Op, Sequelize } from 'sequelize';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { SYSTEM_USER_UUID } from '@tamanu/constants';

export class MedicationDiscontinuer extends ScheduledTask {
  /**
   *
   * @param {import('../ApplicationContext').ApplicationContext} context
   */
  constructor(context) {
    const { schedule, jitterTime, enabled } = config.schedules.medicationDiscontinuer;
    super(schedule, log, jitterTime, enabled);
    this.models = context.store.models;
  }

  getName() {
    return 'MedicationDiscontinuer';
  }

  async run() {
    await this.discontinueMedications();
  }

  async discontinueMedications() {
    const { Prescription } = this.models;
    const currentDateTime = getCurrentDateTimeString();

    await Prescription.update(
      {
        discontinued: true,
        discontinuedDate: Sequelize.literal('end_date'),
        discontinuingClinicianId: SYSTEM_USER_UUID,
        discontinuingReason: 'Prescription end date and time reached',
      },
      {
        where: {
          endDate: { [Op.and]: [{ [Op.lte]: currentDateTime }, { [Op.not]: null }] },
          discontinued: { [Op.not]: true },
        },
      },
    );
  }
}
