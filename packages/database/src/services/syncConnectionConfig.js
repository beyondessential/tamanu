/**
 * Parse a SYNC_URL connection string into the parts the facility sync client
 * needs. Mirrors connectionConfig.js (the DATABASE_URL pattern): the URL carries
 * the connection target and credentials in one string, e.g.
 *
 *   https://sync-user%40example.com:s3cret@central.example.com
 *
 * The username/password are percent-encoded (an email's `@` as `%40`); the URL
 * parser exposes them encoded, so we decode. `origin` drops any path/creds and
 * any default port, which is what CentralServerConnection wants (it appends
 * `/api` itself).
 */
export const parseSyncUrl = url => {
  const parsed = new URL(url);
  return {
    host: parsed.origin,
    email: parsed.username ? decodeURIComponent(parsed.username) : undefined,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
  };
};
