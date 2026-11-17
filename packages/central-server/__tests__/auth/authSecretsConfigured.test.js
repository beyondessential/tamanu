import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import config from 'config';

import { assertAuthSecretsConfigured, buildToken } from '../../app/auth/utils';

// spec: SETTINGS
describe('assertAuthSecretsConfigured', () => {
  const ENV_KEYS = ['AUTH_SECRET', 'AUTH_REFRESH_TOKEN_SECRET'];
  const originalEnv = {};
  let originalSecret;
  let originalRefreshSecret;

  beforeEach(() => {
    ENV_KEYS.forEach(key => {
      originalEnv[key] = process.env[key];
      delete process.env[key];
    });
    originalSecret = config.auth.secret;
    originalRefreshSecret = config.auth.refreshToken.secret;
  });

  afterEach(() => {
    ENV_KEYS.forEach(key => {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    });
    config.auth.secret = originalSecret;
    config.auth.refreshToken.secret = originalRefreshSecret;
  });

  it('passes when both secrets are configured', () => {
    expect(() => assertAuthSecretsConfigured()).not.toThrow();
  });

  it('passes when both secrets come from the environment', () => {
    config.auth.secret = null;
    config.auth.refreshToken.secret = null;
    process.env.AUTH_SECRET = 'env-secret';
    process.env.AUTH_REFRESH_TOKEN_SECRET = 'env-refresh-secret';
    expect(() => assertAuthSecretsConfigured()).not.toThrow();
  });

  it('throws when the access token secret is null', () => {
    config.auth.secret = null;
    expect(() => assertAuthSecretsConfigured()).toThrow(/set AUTH_SECRET$/);
  });

  it('throws when the refresh token secret is null', () => {
    config.auth.refreshToken.secret = null;
    expect(() => assertAuthSecretsConfigured()).toThrow(/set AUTH_REFRESH_TOKEN_SECRET$/);
  });

  it('throws naming both when neither is set', () => {
    config.auth.secret = null;
    config.auth.refreshToken.secret = null;
    expect(() => assertAuthSecretsConfigured()).toThrow(
      /set AUTH_SECRET and AUTH_REFRESH_TOKEN_SECRET$/,
    );
  });

  it('throws when an environment variable is set but empty', () => {
    process.env.AUTH_SECRET = '';
    expect(() => assertAuthSecretsConfigured()).toThrow(/set AUTH_SECRET$/);
  });

  it('throws when a secret is only whitespace', () => {
    process.env.AUTH_REFRESH_TOKEN_SECRET = '   ';
    expect(() => assertAuthSecretsConfigured()).toThrow(/set AUTH_REFRESH_TOKEN_SECRET$/);
  });

  it('refuses to build a token without a signing secret', async () => {
    config.auth.secret = null;
    await expect(
      buildToken({ userId: 'user' }, null, {
        expiresIn: '1h',
        audience: 'access',
        issuer: 'issuer',
      }),
    ).rejects.toThrow(/set AUTH_SECRET$/);
  });
});
