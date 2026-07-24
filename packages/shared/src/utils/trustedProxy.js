import config from 'config';

/**
 * Express `trust proxy` value shared by both servers. Prefers the PROXY_TRUSTED env
 * var (a comma-separated list, which express accepts directly); the config key is
 * transitional and goes away with the config file.
 */
export const getTrustedProxy = () => process.env.PROXY_TRUSTED ?? config.proxy?.trusted ?? 'loopback';
