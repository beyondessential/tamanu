const { each } = require('lodash');
const schemas = require('../../tamanu-common/schemas');
const QueueManager = require('./queue-manager');
const Sync = require('./sync');

class Listeners {
  constructor(database, bayeux) {
    this.database = database;
    this.sync =  new Sync(database, bayeux);
    this.queueManager = new QueueManager(database);

    // Setup sync
    this.sync.setup();
    this.queueManager.on('change', () => this.sync.synchronize());
  }

  addDatabaseListeners() {
    each(schemas, (schema) => {
      if (schema.sync !== false) this._addListener(schema);
    });
    console.log('Database listeners added!');
  }

  _addListener({ name }) {
    const objects = this.database.objects(name);
    let items = this._toJSON(objects);
    objects.addListener((itemsUpdated, changes) => {
      each(changes, (indexes, actionType) => {
        switch (actionType) {
          case 'insertions':
          case 'newModifications':
          case 'modifications':
          case 'oldModifications':
            indexes.forEach((index) => {
              this.queueManager.push({
                action: 'SAVE',
                recordId: itemsUpdated[index]._id,
                recordType: name
              });
            });
            items = this._toJSON(itemsUpdated);
          break;
          case 'deletions':
            indexes.forEach((index) => {
              this.queueManager.push({
                action: 'REMOVE',
                recordId: items[index]._id,
                recordType: name
              });
            });
            items = this._toJSON(itemsUpdated);
          break;
          default:
            console.log(`Ignoring ${actionType}`);
          break;
        }
      });
    });
  }

  _toJSON(object) {
   return JSON.parse(JSON.stringify(object));
  }
}

module.exports = Listeners;
