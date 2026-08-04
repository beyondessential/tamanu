import config from 'config';

// Transitional: copies legacy config-file S3 credentials into the standard AWS
// env vars. Deployments should set AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY
// directly; this shim goes away with the config file.
export const setupEnv = () => {
  const { accessKeyId, secretAccessKey } = config.s3 ?? {};

  // AWS SDK has no way of directly passing creds, this is the least painful supported method
  if (accessKeyId) process.env.AWS_ACCESS_KEY_ID = accessKeyId;
  if (secretAccessKey) process.env.AWS_SECRET_ACCESS_KEY = secretAccessKey;
};
