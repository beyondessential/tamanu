import config from 'config';
import { startOfDay } from 'date-fns';
import { Op, Sequelize } from 'sequelize';

import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';
import { toDateTimeString } from 'shared/utils/dateTime';

export class MedicationDiscontinuer extends ScheduledTask {
  getName() {
    return 'MedicationDiscontinuer';
  }

  constructor(context, isDebug) {
    const { config: contextConfig } = context;
    super(contextConfig.schedules.medicationDiscontinuer.schedule, log);
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

    // Get all encounters with the same facility as the lan server
    // (found in the config). Note that the facility will be read from
    // the department associated to each encounter.
    const encounters = await this.models.Encounter.findAll({
      include: [
        {
          association: 'department',
          required: true,
          include: [{ model: this.models.Facility, where: { id: config.serverFacilityId } }],
        },
      ],
    });

    // Get all the encounter IDs
    const encounterIds = encounters.map(row => row.id);

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
        [Op.in]: encounterIds,
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
