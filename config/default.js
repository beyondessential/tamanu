module.exports = {
  app: {
    port: process.env.SERVER_APP_PORT,
  },
  proxy: {
    port: process.env.PROXY_APP_PORT,
  },
  crypto: {
    pbkdf2: {
      iterations: process.env.PBKDF2_ITERATIONS || 100000,
      keylen: process.env.PBKDF2_KEYLEN || 64,
      digest: process.env.PBKDF2_DIGEST || 'sha512',
    },
  },
  db: {
    host: process.env.MONGODB_HOST,
    user: process.env.MONGODB_USER,
    password: process.env.MONGODB_PASSWORD,
    port: process.env.MONGODB_PORT,
  },
  sync: {
    path: process.env.SYNC_PATH,
    channelIn: process.env.SYNC_CHANNEL_IN,
    channelOut: process.env.SYNC_CHANNEL_OUT
  },
  disableOfflineSync: false,
};
