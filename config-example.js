module.exports = {
  port: process.env.LAN_PORT || 4000,
  db: {
    host: 'localhost',
    user: 'couchadmin',
    password: 'test',
    port: 5990,
    name: process.env.DB_NAME || 'main'
  },
  sync: {
    server: 'http://127.0.0.1:3000/realm-sync',
    channelIn: 'realm-online-local',
    channelOut: 'realm-local-online'
  },
  mainServer: 'http://127.0.0.1:3000',
  offlineMode: false,
};
