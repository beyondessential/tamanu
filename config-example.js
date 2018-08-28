module.exports = {
  port: process.env.PORT,
  localDB: {
    host: process.env.LOCAL_DB_HOST,
    username: process.env.LOCAL_DB_USERNAME,
    password: process.env.LOCAL_DB_PASSWORD,
    port: process.env.LOCAL_DB_PORT,
  },
  remoteDB: {
    host: process.env.REMOTE_DB_HOST,
    username: process.env.REMOTE_DB_USERNAME,
    password: process.env.REMOTE_DB_PASSWORD,
    port: process.env.REMOTE_DB_PORT
  },
  couchPubSubUrl: process.env.PUB_SUB_URL
};
