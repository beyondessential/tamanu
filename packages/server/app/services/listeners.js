const { each } = require('lodash');
const { schemas } = require('../../../shared/schemas');
const QueueManager = require('./queue-manager');
const Sync = require('./sync');
const { jsonParse } = require('../utils');
const { SYNC_MODES } = require('../constants');

class Listeners {
  constructor(database, bayeux) {
    this.database = database;
    this.sync =  new Sync(database, bayeux);
    this.queueManager = new QueueManager(database);

    // Setup sync
    this.sync.disconnectClients();
    this.sync.setup();
    this.queueManager.on('change', () => this.sync.synchronize());
  }

  addDatabaseListeners() {
    each(schemas, (schema) => {
      if (schema.sync === SYNC_MODES.ON || schema.sync === SYNC_MODES.REMOTE_TO_LOCAL) {
        this._addListener(schema);
      }
    });
    console.log('Database listeners added!');
  }

  _addListener({ name, onChange }) {
    const objects = this.database.objects(name);
    let items = jsonParse(objects);
    objects.addListener((itemsUpdated, changes) => {
      each(changes, (indexes, actionType) => {
        switch (actionType) {
          case 'insertions':
          case 'newModifications':
          case 'modifications':
          case 'oldModifications':
            indexes.forEach((index) => {
              const queueItem = {
                action: 'SAVE',
                recordId: itemsUpdated[index]._id,
                recordType: name
              };
              this.queueManager.push(queueItem);
              // trigger onChange event for the schema
              if (onChange) {
                onChange(
                  {
                    record: itemsUpdated[index], ...queueItem
                  },
                  this.database,
                  this.queueManager,
                );
              }
            });
            items = jsonParse(itemsUpdated);
          break;
          case 'deletions':
            indexes.forEach((index) => {
              this.queueManager.push({
                action: 'REMOVE',
                recordId: items[index]._id,
                recordType: name
              });
            });
            items = jsonParse(itemsUpdated);
          break;
          default:
            console.log(`Ignoring ${actionType}`);
          break;
        }
      });
    });
  }
}

module.exports = Listeners;
