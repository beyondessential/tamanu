const readEnv = name => {
  if (window?.env?.[name]) {
    return window.env[name];
  }

  if (localStorage.getItem(name)) {
    return localStorage.getItem(name);
  }

  if (process?.env?.[name]) {
    return process.env[name];
  }

  return null;
};

// remember to update Caddyfile.docker when touching these
export const NODE_ENV = readEnv('NODE_ENV');
export const BUGSNAG_API_KEY = readEnv('BUGSNAG_API_KEY');
export const VERSION = __VERSION__;
export const REVISION = readEnv('REVISION');
export const FULL_VERSION = [VERSION, REVISION].filter(Boolean).join('-');
export const IS_DEVELOPMENT = NODE_ENV === 'development';
