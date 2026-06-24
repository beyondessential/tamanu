/**
 * Parse a SYNC_URL (e.g. https://email%40x.io:pass@central.example.com) into
 * { host, email, password }, à la connectionConfig's DATABASE_URL handling.
 * Credentials are percent-encoded in the URL, so decode them; `origin` drops the
 * path/creds (CentralServerConnection appends /api itself).
 */
export const parseSyncUrl = url => {
  const parsed = new URL(url);
  return {
    host: parsed.origin,
    email: parsed.username ? decodeURIComponent(parsed.username) : undefined,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
  };
};
