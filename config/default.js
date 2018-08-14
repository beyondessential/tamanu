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
  localDB: {
    username: process.env.COUCHDB_LOCAL_USERNAME,
    password: process.env.COUCHDB_LOCAL_PASSWORD,
    host: process.env.COUCHDB_LOCAL_HOST,
    database: process.env.COUCHDB_LOCAL_DATABASE,
  },
  remoteDB: {
    username: process.env.COUCHDB_REMOTE_USERNAME,
    password: process.env.COUCHDB_REMOTE_PASSWORD,
    host: process.env.COUCHDB_REMOTE_HOST,
    database: process.env.COUCHDB_REMOTE_DATABASE,
  },
};
