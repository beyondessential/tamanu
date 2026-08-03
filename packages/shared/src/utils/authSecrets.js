import config from 'config';

/**
 * JWT signing secrets. Prefer the env vars; the config keys are transitional and go
 * away with the config file. Callers keep their own fallback behaviour when neither
 * is set (e.g. a per-process random secret).
 */
export const getAuthSecret = () => process.env.AUTH_SECRET ?? config.auth?.secret;

export const getRefreshTokenSecret = () =>
  process.env.AUTH_REFRESH_TOKEN_SECRET ?? config.auth?.refreshToken?.secret;
