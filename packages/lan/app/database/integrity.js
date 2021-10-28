import config from 'config';

export async function performDatabaseIntegrityChecks(context) {
  await ensureHostMatches(context);
  await ensureFacilityMatches(context);
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

  const configuredHost = config.sync.host;
  const lastHost = await LocalSystemFact.get('syncHost');
  if (lastHost && lastHost !== configuredHost) {
    throw new Error(
      `integrity check failed: sync.host mismatch: read ${configuredHost} from config, but already connected to ${lastHost} (you may need to drop and recreate the database, change the config back, or if you're 100% sure, remove the "syncHost" key from the "local_metadata" table)`,
    );
  }
}
