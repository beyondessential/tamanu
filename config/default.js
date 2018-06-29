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
    user: process.env.MONGODB_USER,
    password: process.env.MONGODB_PASSWORD,
    host: process.env.MONGODB_HOST,
    database: process.env.MONGODB_DATABASE,
  },
};
