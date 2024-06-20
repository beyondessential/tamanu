import config from 'config';
import { startOfDay } from 'date-fns';
import { Op, Sequelize } from 'sequelize';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { toDateTimeString } from '@tamanu/shared/utils/dateTime';

export class MedicationDiscontinuer extends ScheduledTask {
  getName() {
    return 'MedicationDiscontinuer';
  }

  constructor(context, isDebug) {
    const { schedule, jitterTime } = config.schedules.medicationDiscontinuer;
    super(schedule, log, jitterTime);
    this.models = context.models;
    this.sequelize = context.sequelize;

    // Run once on startup (in case the server was down when it was scheduled)
    if (!isDebug) {
      this.run();
    }
  }

  async run() {
    // Get start of day
    const startOfToday = toDateTimeString(startOfDay(new Date()));

    // Query interface expects database naming scheme
    // (snake case, table column fields)
    // Values to be updated when autodiscontinuing a medication
    const values = {
      discontinued: true,
      discontinuing_reason: 'Finished treatment',
      updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
    };

    // Find all medications that:
    // - Are not discontinued
    // - Belong to an encounter from that matches the current facility
    // - Have an end date (not null) and said end date is previous than today
    const identifier = {
      discontinued: {
        [Op.not]: true,
      },
      encounter_id: {
        [Op.in]: Sequelize.literal(
          `(
            -- Get all encounters with the same facility ID as this facility server (from local_system_facts).
            -- Note that the facility ID will be read from the department associated to each encounter.
            SELECT encounters.id
            FROM encounters
            INNER JOIN
              departments ON encounters.department_id = departments.id
            WHERE departments.facility_id = (SELECT value FROM local_system_facts where key = 'facilityId')
          )`,
        ),
      },
      end_date: {
        [Op.and]: [{ [Op.lt]: startOfToday }, { [Op.not]: null }],
      },
    };

    // Discontinue medications that match the conditions from
    // the identifier with the values provided
    const queryInterface = this.sequelize.getQueryInterface();
    await queryInterface.bulkUpdate('encounter_medications', values, identifier);
  }
}
