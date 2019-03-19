const { SenaitePoller } = require('./SenaitePoller');
const config = require('config');

function startScheduledTasks(database) {
  if (config.senaite.enabled) {
    const senaite = new SenaitePoller(database);
    senaite.beginPolling();
  }
}

module.exports = { startScheduledTasks };
