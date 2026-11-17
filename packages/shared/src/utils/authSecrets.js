import config from 'config';

/**
 * JWT signing secrets. Prefer the env vars; the config keys are transitional and go
 * away with the config file. The central server refuses to start without both; the
 * facility server falls back to a per-process random secret.
 */
export const getAuthSecret = () => process.env.AUTH_SECRET ?? config.auth?.secret;

export const getRefreshTokenSecret = () =>
  process.env.AUTH_REFRESH_TOKEN_SECRET ?? config.auth?.refreshToken?.secret;
