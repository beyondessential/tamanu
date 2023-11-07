import { Command } from 'commander';
import { Op } from 'sequelize';
import { log } from '@tamanu/shared/services/logging';
import { initDatabase } from '../database';

export async function migrateAppointments() {
  log.info('Migrating appointments...');

  const store = await initDatabase({ testMode: false });
  const { Appointment } = store.models;

  try {
    let migrated = 0;
    const appointments = await Appointment.findAll({
      include: 'location',
      where: { locationGroupId: { [Op.is]: null } },
    });

    await Promise.all(
      appointments.map(async a => {
        const { location } = a;
        const { locationGroupId } = location;
        // Skip if there is no location group
        if (locationGroupId) {
          await a.update({ locationGroupId });
          migrated++;
        } else {
          log.warn(`The following location has no related location group: ${location.name}`);
        }
        return location;
      }),
    );

    log.info(`Successfully migrated ${migrated} appointments`);
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
