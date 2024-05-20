import config from 'config';
import { log } from '@tamanu/shared/services/logging';
import { isSyncTriggerDisabled } from '@tamanu/shared/dataMigrations';
import { selectFacilityIds } from '@tamanu/shared/utils';
import { CentralServerConnection } from '../sync';

const FACILITY_IDS_SEPARATOR = ', ';

export async function performDatabaseIntegrityChecks(context) {
  if (await isSyncTriggerDisabled(context.sequelize)) {
    throw Error('Sync Trigger is disabled in the database.');
  }

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
  const { LocalSystemFact } = context.models;
  const centralServer = new CentralServerConnection(context);
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
  const configuredFacilities = selectFacilityIds(config);
  const lastFacilities = await LocalSystemFact.get('facilityIds');

  if (!lastFacilities) {
    await performInitialIntegritySetup(context);
    return;
  }

  // ensure both arrays contain the same set of facility ids
  const match = lastFacilities
    .split(FACILITY_IDS_SEPARATOR)
    .every(facilityId => configuredFacilities.includes(facilityId));
  if (!match) {
    // if the facility doesn't match, error
    throw new Error(
      `integrity check failed: serverFacilityId mismatch: read ${configuredFacilities} from config, but already registered as ${lastFacilities} (you may need to drop and recreate the database, change the config back, or if you're 100% sure, remove the "facilityIds" key from the "local_system_fact" table)`,
    );
  }
}

async function performInitialIntegritySetup(context) {
  const centralServer = new CentralServerConnection(context);
  log.info(`Verifying sync connection to ${centralServer.host}...`);

  const { token, serverFacilityIds } = await centralServer.connect();

  if (!token) {
    throw new Error('Could not obtain valid token from central server.');
  }

  // We've ensured that our immutable config stuff is valid -- save it!
  const { LocalSystemFact } = context.models;
  const facilityIdsString = serverFacilityIds.join(FACILITY_IDS_SEPARATOR);
  await LocalSystemFact.set('facilityIds', facilityIdsString);

  log.info(`Verified with central server as facilities ${facilityIdsString}`);
}
