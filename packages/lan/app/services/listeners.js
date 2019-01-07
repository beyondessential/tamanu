const { each } = require('lodash');
const { schemas } = require('../../../shared/schemas');
const QueueManager = require('./queue-manager');
const Sync = require('./sync');

class Listeners {
  constructor(database) {
    this.database = database;
    this.sync = new Sync(database, this);
    this.queueManager = new QueueManager(database);
    this.collections = {};
  }

  setupSync() {
    this.sync.setup();
    // this.sync.synchronize();
    this.queueManager.on('change', () => this.sync.synchronize());
  }

  addDatabaseListeners() {
    each(schemas, (schema) => {
      if (schema.sync !== false) this._addListener(schema.name);
    });
    console.log('Database listeners added!');
  }

  removeDatabaseListeners() {
    each(schemas, (schema) => {
      if (schema.sync !== false) this._removeListener(schema.name);
    });
    console.log('Database listeners removed!');
  }

  _addListener(recordType) {
    this.database.addListener(recordType, (action, record) => {
      if (record.fullySynced) {
        switch (action) {
          case 'SAVE':
          case 'REMOVE':
          case 'WIPE':
            this.queueManager.push({
              action,
              recordId: record._id,
              recordType
            });
          break;
          default:
            console.log(`Ignoring ${action}`);
          break;
        }
      }
    });
  }

  _removeListener(recordType) {
    this.database.removeListener(recordType);
  }

  _toJSON(object) {
    return JSON.parse(JSON.stringify(object));
  };
}

module.exports = Listeners;