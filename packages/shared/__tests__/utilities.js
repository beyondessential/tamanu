const config = require('config');
const {
  openDatabase,
  closeAllDatabases,
} = require('@tamanu/database/services/database');
const { seedSettings } = require('@tamanu/database/demoData');

async function createTestDatabase() {
  const store = await openDatabase('test-shared-main', {
    ...config.db,
    testMode: true,
  });
  await store.sequelize.migrate('up');
  return store;
}

/**
 * Create a minimal test context (store + close) for shared package tests that need a database.
 * Uses central-server config when NODE_CONFIG_DIR is set in setup.js.
 */
async function createTestContext() {
  const store = await createTestDatabase();
  await seedSettings(store.models);

  return {
    store,
    close: () => closeAllDatabases(),
  };
}

module.exports = { createTestContext };
