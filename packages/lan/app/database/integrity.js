import config from 'config';

export async function performIntegrityChecks(context) {
  await ensureHostMatches(context);
}

async function ensureHostMatches(context) {
  const { LocalMetadata } = context.models;

  const configuredHost = config.sync.host;
  const lastHost = await LocalMetadata.get('host');
  if (lastHost && lastHost !== configuredHost) {
    throw new Error(
      `integrity check failed: sync.host mismatch: read ${configuredHost} from config, but already connected to ${lastHost} (you may need to drop and recreate the database, change the config back, or if you're 100% sure, remove the "host" key from the "local_metadata" table)`,
    );
  }

  await LocalMetadata.set('host', configuredHost);
}
