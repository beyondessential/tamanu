import config from 'config';
import { log } from '@tamanu/shared/services/logging';
import { CentralServerConnection } from '../sync';

export async function performDatabaseIntegrityChecks(context) {
  // run in a transaction so any errors roll back all changes
  await context.sequelize.transaction(async () => {
    await ensureHostMatches(context);
    await ensureFacilityMatches(context);
  });
}

/*
 * ensureHostMatches
 */
async function ensureHostMatches(context) {
  const { settings, models } = context;
  const { LocalSystemFact } = models;
  const syncConfig = await settings.get('sync');
  const centralServer = new CentralServerConnection(context, syncConfig);
  const configuredHost = centralServer.host;
  const lastHost = await LocalSystemFact.get('syncHost');

  if (!lastHost) {
    await LocalSystemFact.set('syncHost', centralServer.host);
    return;
  }

  if (lastHost !== configuredHost) {
    throw new Error(
      `integrity check failed: sync.host mismatch: read ${configuredHost} from config, but already connected to ${lastHost} (you may need to drop and recreate the database, change the config back, or if you're 100% sure, remove the "syncHost" key from the "local_system_fact" table)`,
    );
  }
}

/*
 * ensureFacilityMatches
 */
async function ensureFacilityMatches(context) {
  const { LocalSystemFact } = context.models;
  const configuredFacility = config.serverFacilityId;
  const lastFacility = await LocalSystemFact.get('facilityId');

  if (!lastFacility) {
    await performInitialIntegritySetup(context);
    return;
  }

  if (lastFacility !== configuredFacility) {
    // if the facility doesn't match, error
    throw new Error(
      `integrity check failed: serverFacilityId mismatch: read ${configuredFacility} from config, but already registered as ${lastFacility} (you may need to drop and recreate the database, change the config back, or if you're 100% sure, remove the "facilityId" key from the "local_system_fact" table)`,
    );
  }
}

async function performInitialIntegritySetup(context) {
  const { settings, models } = context;
  const syncConfig = await settings.get('sync');
  const centralServer = new CentralServerConnection(context, syncConfig);

  log.info(`Verifying sync connection to ${centralServer.host}...`);

  const { token, facility } = await centralServer.connect();

  if (!token) {
    throw new Error('Could not obtain valid token from sync server.');
  }

  if (!facility) {
    throw new Error(
      `Configured serverFacilityId ${config.serverFacilityId} not recognised by sync server`,
    );
  }

  // We've ensured that our immutable config stuff is valid -- save it!
  const { LocalSystemFact } = models;
  await LocalSystemFact.set('facilityId', facility.id);

  log.info(`Verified with sync server as ${facility.name}`);
}
