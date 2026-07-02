import config from 'config';

/**
 * The server's own public URL (JWT issuer, importer host, meta-server registration).
 * Prefers the CANONICAL_HOST_NAME env var; the config key is transitional and goes
 * away with the config file.
 */
export const getCanonicalHostName = () =>
  process.env.CANONICAL_HOST_NAME ?? config.canonicalHostName;
