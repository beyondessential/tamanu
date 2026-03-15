// suppress warning about empty config
process.env.SUPPRESS_NO_CONFIG_WARNING = true;

// Use central-server config for tests that need database (db, integrations.fhir, etc.)
const path = require('path');
process.env.NODE_CONFIG_DIR =
  process.env.NODE_CONFIG_DIR ?? path.resolve(__dirname, '../../central-server/config');
