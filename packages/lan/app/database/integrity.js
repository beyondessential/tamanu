import config from 'config';
import { WebRemote } from '../sync';
import { log } from 'shared/services/logging';

export async function performDatabaseIntegrityChecks(context) {
  const existingFact = await context.models.LocalSystemFact.get('syncHost');
  if(false && existingFact) {
    await ensureHostMatches(context);
    await ensureFacilityMatches(context);
  } else {
    await performInitialIntegritySetup(context);
  }
}

async function performInitialIntegritySetup(context) {
  const remote = new WebRemote(context)
  log.info(`Verifying sync connection to ${remote.host}...`);

  const { token, facility } = await remote.connect();

  if (!token) {
    throw new Error("Could not obtain valid token from sync server.");
  }

  if (!facility) {
    throw new Error(`Configured serverFacilityId ${config.currentFacilityId} not recognised by sync server`);
  }

  // We've ensured that our immutable config stuff is valid -- save it!
  const { LocalSystemFact } = context.models;
  await LocalSystemFact.set('facilityId', facility.id);
  await LocalSystemFact.set('syncHost', remote.host);
  log.info(`Verified with sync server as ${facility.name}`);
}

async function ensureFacilityMatches(context) {
  const { LocalSystemFact } = context.models;

  const configuredFacility = config.currentFacilityId;
  const lastFacility = await LocalSystemFact.get('facilityId');
  if (lastFacility && lastFacility !== configuredFacility) {
    throw new Error(
      `integrity check failed: currentFacilityId mismatch: read ${configuredFacility} from config, but already registered as ${lastFacility} (you may need to drop and recreate the database, change the config back, or if you're 100% sure, remove the "facilityId" key from the "local_metadata" table)`,
    );
  }
}

async function ensureHostMatches(context) {
  const { LocalSystemFact } = context.models;
  const remote = new WebRemote(context)

  const configuredHost = remote.host;
  const lastHost = await LocalSystemFact.get('syncHost');
  if (lastHost && lastHost !== configuredHost) {
    throw new Error(
      `integrity check failed: sync.host mismatch: read ${configuredHost} from config, but already connected to ${lastHost} (you may need to drop and recreate the database, change the config back, or if you're 100% sure, remove the "syncHost" key from the "local_metadata" table)`,
    );
  }
}
