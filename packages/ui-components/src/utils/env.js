const readEnv = name => {
  if (window?.env?.[name]) {
    return window.env[name];
  }

  if (window?.localStorage?.getItem(name)) {
    return window?.localStorage?.getItem(name);
  }

  if (process?.env?.[name]) {
    return process.env[name];
  }

  return null;
};

// update env_js in packages/supervisor/src/files.rs when touching these
export const NODE_ENV = readEnv('NODE_ENV');
export const VERSION = __VERSION__;
export const REVISION = readEnv('REVISION');
export const FULL_VERSION = [VERSION, REVISION].filter(Boolean).join('-');
export const IS_DEVELOPMENT = NODE_ENV === 'development';
