import config from 'config';

export const setupEnv = () => {
  // TODO
  const { accessKeyId, secretAccessKey } = config.s3;

  // AWS SDK has no way of directly passing creds, this is the least painful supported method
  process.env.AWS_ACCESS_KEY_ID = accessKeyId;
  process.env.AWS_SECRET_ACCESS_KEY = secretAccessKey;
};
