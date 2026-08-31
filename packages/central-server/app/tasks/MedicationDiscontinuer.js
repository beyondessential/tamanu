import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { QueryTypes } from 'sequelize';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { SYSTEM_USER_UUID } from '@tamanu/constants';

export class MedicationDiscontinuer extends ScheduledTask {
  /**
   *
   * @param {import('../ApplicationContext').ApplicationContext} context
   */
  constructor(context) {
    const { schedule, jitterTime, enabled } = context.schedules.medicationDiscontinuer;
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

    // Copying end_date per row needs raw SQL: through Model.update the discontinuedDate setter
    // is handed the literal rather than a date, and rejects it.
    await Prescription.sequelize.query(
      `
      UPDATE prescriptions
      SET discontinued = true,
          discontinued_date = end_date,
          discontinuing_clinician_id = :systemUserId,
          discontinuing_reason = :reason,
          updated_at = CURRENT_TIMESTAMP
      WHERE end_date IS NOT NULL
        AND end_date <= :currentDateTime
        AND discontinued IS NOT TRUE
        AND deleted_at IS NULL
      `,
      {
        replacements: {
          systemUserId: SYSTEM_USER_UUID,
          reason: 'Prescription end date and time reached',
          currentDateTime: getCurrentDateTimeString(),
        },
        type: QueryTypes.UPDATE,
      },
    );
  }
}
