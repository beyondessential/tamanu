import { Command } from 'commander';
import { Op } from 'sequelize';
import { log } from 'shared/services/logging';
import { initDatabase } from '../database';

export async function migrateImagingRequests() {
  log.info('Migrating imaging requests...');

  const store = await initDatabase({ testMode: false });
  const { ImagingRequest } = store.models;

  try {
    let migrated = 0;
    const imagingRequests = await ImagingRequest.findAll({
      include: 'location',
      where: { locationGroupId: { [Op.is]: null }, locationId: { [Op.not]: null } },
    });

    await Promise.all(
      imagingRequests.map(async record => {
        const { location } = record;
        const { locationGroupId } = location;
        if (locationGroupId) {
          await record.update({ locationGroupId });
          migrated++;
        } else {
          // Skip if there is no location group
          log.warn(`The following location has no related location group: ${location.name}`);
        }
        return location;
      }),
    );

    log.info(`Successfully migrated ${migrated} records`);
    process.exit(0);
  } catch (error) {
    log.info(`Command failed: ${error.stack}\n`);
    process.exit(1);
  }
}

export const migrateImagingRequestsToLocationGroupsCommand = new Command(
  'migrateImagingRequestsToLocationGroups',
)
  .description('Migrates imaging requests from locations to location groups')
  .action(migrateImagingRequests);
