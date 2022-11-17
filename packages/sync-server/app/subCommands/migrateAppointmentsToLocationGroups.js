import { Command } from 'commander';
import { Op } from 'sequelize';
import { log } from 'shared/services/logging';
import { initDatabase } from '../database';

export async function migrateAppointments() {
  log.info('Migrating appointments...');

  const store = await initDatabase({ testMode: false });
  const { Appointment } = store.models;

  try {
    const appointments = await Appointment.findAll({
      include: 'location',
      where: { locationGroupId: { [Op.is]: null } },
    });

    const migrated = await Promise.all(
      appointments.map(async a => {
        const { location } = a;
        const { locationGroupId } = location;
        // Skip if there is no location group
        if (locationGroupId) {
          await a.update({ locationGroupId });
        } else {
          log.info(`Warning, the following location has no relate location group ${location.name}`);
        }
        return location;
      }),
    );

    log.info(`Sucessfully migrated ${migrated.length} appointments`);
    process.exit(0);
  } catch (error) {
    log.info(`Command failed: ${error.stack}\n`);
    process.exit(1);
  }
}

export const migrateAppointmentsToLocationGroupsCommand = new Command(
  'migrateAppointmentsToLocationGroups',
)
  .description('Migrates appointments from locations to location groups')
  .action(migrateAppointments);
