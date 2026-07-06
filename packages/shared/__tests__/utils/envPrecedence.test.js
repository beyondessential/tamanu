import { getAuthSecret, getRefreshTokenSecret } from '../../src/utils/authSecrets';
import { getCanonicalHostName } from '../../src/utils/canonicalHostName';

// The config -> env cutover (TAM-6864) keeps the config keys as a transitional
// fallback: each getter prefers its env var and falls back to the (soon-removed)
// config key. This locks in that precedence so the fallback can't silently flip.
jest.mock('config', () => ({
  __esModule: true,
  default: {
    auth: { secret: 'config-secret', refreshToken: { secret: 'config-refresh' } },
    canonicalHostName: 'https://config-host.example',
  },
}));

describe('env-var precedence over config', () => {
  const ENV_KEYS = ['AUTH_SECRET', 'AUTH_REFRESH_TOKEN_SECRET', 'CANONICAL_HOST_NAME'];
  const original = {};

  beforeEach(() => {
    ENV_KEYS.forEach(key => {
      original[key] = process.env[key];
      delete process.env[key];
    });
  });
  afterEach(() => {
    ENV_KEYS.forEach(key => {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    });
  });

  describe('getAuthSecret', () => {
    it('uses AUTH_SECRET, overriding config, when set', () => {
      process.env.AUTH_SECRET = 'env-secret';
      expect(getAuthSecret()).toBe('env-secret');
    });
    it('falls back to config.auth.secret when the env var is unset', () => {
      expect(getAuthSecret()).toBe('config-secret');
    });
  });

  describe('getRefreshTokenSecret', () => {
    it('uses AUTH_REFRESH_TOKEN_SECRET, overriding config, when set', () => {
      process.env.AUTH_REFRESH_TOKEN_SECRET = 'env-refresh';
      expect(getRefreshTokenSecret()).toBe('env-refresh');
    });
    it('falls back to config.auth.refreshToken.secret when the env var is unset', () => {
      expect(getRefreshTokenSecret()).toBe('config-refresh');
    });
  });

  describe('getCanonicalHostName', () => {
    it('uses CANONICAL_HOST_NAME, overriding config, when set', () => {
      process.env.CANONICAL_HOST_NAME = 'https://env-host.example';
      expect(getCanonicalHostName()).toBe('https://env-host.example');
    });
    it('falls back to config.canonicalHostName when the env var is unset', () => {
      expect(getCanonicalHostName()).toBe('https://config-host.example');
    });
  });
});
