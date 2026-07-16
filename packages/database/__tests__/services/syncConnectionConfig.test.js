import { describe, expect, it } from 'vitest';
import { parseSyncUrl } from '../../src/services/syncConnectionConfig';

describe('parseSyncUrl', () => {
  it('parses host and credentials from a SYNC_URL', () => {
    expect(parseSyncUrl('https://user:pass@central.example.com')).toEqual({
      host: 'https://central.example.com',
      email: 'user',
      password: 'pass',
    });
  });

  it('decodes a percent-encoded email username (@ as %40)', () => {
    expect(parseSyncUrl('https://sync-user%40example.com:s3cret@central.example.com')).toEqual({
      host: 'https://central.example.com',
      email: 'sync-user@example.com',
      password: 's3cret',
    });
  });

  it('keeps an explicit non-default port in the host', () => {
    expect(parseSyncUrl('https://u:p@central.example.com:8443').host).toBe(
      'https://central.example.com:8443',
    );
  });

  it('drops any path from the host (CentralServerConnection appends /api)', () => {
    expect(parseSyncUrl('https://u:p@central.example.com/some/path').host).toBe(
      'https://central.example.com',
    );
  });

  it('returns undefined credentials when the URL has none', () => {
    expect(parseSyncUrl('https://central.example.com')).toEqual({
      host: 'https://central.example.com',
      email: undefined,
      password: undefined,
    });
  });

  it('throws on a non-URL string', () => {
    expect(() => parseSyncUrl('not a url')).toThrow();
  });
});
