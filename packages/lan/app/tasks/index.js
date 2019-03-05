const { SenaitePoller } = require('./SenaitePoller');
const config = require('config');

function startScheduledTasks(database) {
  if(config.senaite.enabled) {
    const senaite = new SenaitePoller(database);
    senaite.beginPolling();
    
    // TODO: TEMP CODE DELETE THIS
    setTimeout(() => senaite.run(), 1000);
  }
}

module.exports = { startScheduledTasks };
