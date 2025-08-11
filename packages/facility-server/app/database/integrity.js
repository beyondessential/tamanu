import config from 'config';
import { FACT_CENTRAL_HOST, FACT_FACILITY_IDS } from '@tamanu/constants/facts';
import { log } from '@tamanu/shared/services/logging';
import { isSyncTriggerDisabled } from '@tamanu/database/dataMigrations';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { CentralServerConnection } from '../sync';

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
  const lastHost = await LocalSystemFact.get(FACT_CENTRAL_HOST);

  if (!lastHost) {
    await LocalSystemFact.set(FACT_CENTRAL_HOST, centralServer.host);
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
  const lastFacilities = await LocalSystemFact.get(FACT_FACILITY_IDS);

  if (lastFacilities) {
    // ensure both arrays contain the same set of facility ids
    const match = JSON.parse(lastFacilities).every(facilityId =>
      configuredFacilities.includes(facilityId),
    );
    if (!match) {
      // if the facility doesn't match, error
      throw new Error(
        `integrity check failed: serverFacilityId mismatch: read ${configuredFacilities} from config, but already registered as ${lastFacilities} (you may need to drop and recreate the database, change the config back, or if you're 100% sure, remove the "facilityIds" key from the "local_system_fact" table)`,
      );
    }
  } else {
    const centralServer = new CentralServerConnection(context);
    log.info(`Verifying central server connection to ${centralServer.host}...`);
    await centralServer.connect();
    if (!centralServer.hasToken()) {
      throw new Error('Could not obtain valid token from central server.');
    }

    log.info('Verified central server connection');

    const facilityIdsString = JSON.stringify(configuredFacilities);
    await LocalSystemFact.set(FACT_FACILITY_IDS, facilityIdsString);
    log.info('Recorded facility IDs to database');
  }
}
