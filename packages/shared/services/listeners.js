import { each } from 'lodash';
import { schemas } from '../schemas';
import { SYNC_MODES, SYNC_ACTIONS } from '../constants';

export default class Listeners {
  constructor(database) {
    this.database = database;
    this.collections = {};
  }

  setupSync() {
    this.sync.setup();
    // this.sync.synchronize();
    this.queueManager.on('change', () => this.sync.synchronize());
  }

  addDatabaseListeners() {
    each(schemas, (schema) => {
      if (schema.sync === SYNC_MODES.ON || schema.sync === SYNC_MODES.LOCAL_TO_REMOTE) {
        this.addListener(schema.name);
      }
    });
    console.log('Database listeners added!');
  }

  removeDatabaseListeners() {
    each(schemas, (schema) => {
      if (schema.sync === SYNC_MODES.ON || schema.sync === SYNC_MODES.LOCAL_TO_REMOTE) {
        this.removeListener(schema.name);
      }
    });
    console.log('Database listeners removed!');
  }

  addListener(recordType) {
    this.database.addListener(recordType, (action, record) => {
      switch (action) {
        case SYNC_ACTIONS.SAVE:
        case SYNC_ACTIONS.REMOVE:
        case SYNC_ACTIONS.WIPE:
          this.queueManager.push({
            action,
            recordId: record._id,
            recordType,
          });
          break;
        default:
          console.log(`Ignoring ${action}`);
          break;
      }
    });
  }

  removeListener(recordType) {
    this.database.removeListener(recordType);
  }

  _toJSON = (object) => JSON.parse(JSON.stringify(object));
}
