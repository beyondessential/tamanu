#!/usr/bin/env node

process.env.SUPPRESS_NO_CONFIG_WARNING = 'y';
const config = require('config');
const path = require('node:path');
const pg = require('pg');

async function dbConfig(packageName) {
  const serverConfig = config.util.loadFileConfigs(path.join('packages', packageName, 'config'));
  const db = config.util.extendDeep(serverConfig.db, config.db); // merge with NODE_CONFIG

  const client = new pg.Client({
    host: db.host,
    port: db.port,
    user: db.username,
    database: db.name,
    password: db.password,
  });
  await client.connect();

  return {
    client,
    ...db,
  };
}

module.exports = {
  dbConfig,
};
