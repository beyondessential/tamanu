const Faye = require('faye');
const { isArray, each } = require('lodash');
const config = require('config');
const { objectToJSON } = require('../utils');
const { outgoing } = require('../utils/faye-extensions');

class Sync {
  constructor(database, listeners) {
    this.database = database;
    this.listeners = listeners;
    this.client = new Faye.Client(`${config.mainServer}/${config.sync.path}`);
    this.client.addExtension({
      outgoing: (message, callback) => outgoing({ database, message, callback })
    });
  }

  setup() {
    const clientId = this.database.getSetting('CLIENT_ID');
    const subscription = this.client.subscribe(`/${config.sync.channelIn}/${clientId}`).withChannel((channel, message) => {
      console.log(`[MessageIn - ${config.sync.channelIn}/${clientId}] - [${channel}]`, { action: message.action, type: message.recordType, id: message.recordId });
      switch (message.action) {
        case 'SAVE':
          this._saveRecord(message);
        break;
        case 'REMOVE':
          this._removeRecord(message);
        break;
        default:
          throw new Error('No action specified');
      }
    });

    subscription.callback(() => {
      this.synchronize();
      console.log('[SUBSCRIBE SUCCEEDED]');
    });

    subscription.errback((error) => {
      console.log('[SUBSCRIBE FAILED]', error);
    });

    this.client.bind('transport:down', () => {
      console.log('[CONNECTION DOWN]');
    });

    this.client.bind('transport:up', () => {
      console.log('[CONNECTION UP]');
    });
  }

  synchronize() {
    try {
      const lastSyncTime = this.database.getSetting('LAST_SYNC_OUT');
      console.log('lastSyncTime', lastSyncTime);
      const changes = this.database.find('change', `timestamp >= "${lastSyncTime}"`);
      const tasks = [];
      changes.forEach(change => tasks.push(this._publishMessage(objectToJSON(change))));
      Promise.all(tasks);
    } catch (err) {
      throw new Error(err);
    }
  }

  async _publishMessage(change) {
    try {
      const clientId = this.database.getSetting('CLIENT_ID');
      let record = this.database.findOne(change.recordType, change.recordId);
      if (record) record = objectToJSON(record);
      await this.client.publish(`/${config.sync.channelOut}`, {
        from: clientId,
        record,
        ...change
      });

      // Update last sync out date
      this.database.setSetting('LAST_SYNC_OUT', new Date().getTime());
      console.log('[MessageOut]', `/${config.sync.channelOut}`, { action: change.action, type: change.recordType, id: change.recordId });
    } catch (err) {
      throw new Error(err);
    }
  }

  _saveRecord({ record, recordType }) {
    try{
      this.database.write(() => {
        this.database.create(recordType, record, true, true);
      });
    } catch (err) {
      console.error(err.toString(), record);
      throw err;
    }
  }

  _removeRecord(props) {
    try{
      this.database.write(() => {
        this.database.deleteByPrimaryKey(props.recordType, props.recordId, '_id', true);
      });
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Sync;