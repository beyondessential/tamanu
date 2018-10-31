const config = require('config');
const { objectToJSON, incoming } = require('../utils');
const { each, has } = require('lodash');
const moment = require('moment');

class Sync {
  constructor(database, faye) {
    this.database = database;
    this.client = faye; // new Faye.Client(`http://127.0.0.1:${config.app.port}/${config.syncPath}`);
    this.client.addExtension({
      incoming: (message, callback) => incoming({ database, message, callback })
    });
  }

  // setup() {
  //   const clients = this.database.find('client');
  //   clients.forEach(client => this._addSubscriber(client));
  // }

  synchronize() {
    const fiveMinsAgo = moment().subtract(5, 'minutes').toDate().getTime();
    const clients = this.database.find('client', `lastActive > ${fiveMinsAgo}`);
    clients.forEach(client => this._sync(client));
  }

  async _sync(client) {
    try {
      const { syncOut: lastSyncTime } = client;
      const changes = this.database.find('change', `timestamp >= "${lastSyncTime}"`);
      const tasks = [];
      changes.forEach(change => tasks.push(this._publishMessage(objectToJSON(change), client)));
      await Promise.all(tasks);

      // Update sync date
      this.database.write(() => {
        client.syncOut = new Date().getTime();
      });
    } catch (err) {
      throw new Error(err);
    }
  }

  setup() {
    // On handshake
    this.client.on('handshake', (clientId) => {
      console.log('Client connected', clientId);
    });

    // On new message
    this.client.on('publish', (clientId, channel, message) => {
      if (channel === `/${config.sync.channelIn}`) {
        console.log(`[MessageIn - ${config.sync.channelIn}]`, { action: message.action, type: message.recordType, id: message.recordId });
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
      }
    });

    this.client.on('subscribe', (clientId, channel) => {
      console.log(`[SUBSCRIBE - ${clientId}] -> ${channel}`);
      this.synchronize();
      // this.database.write(() => {
      //   client.active = true;
      // });
    });

    this.client.on('unsubscribe', (clientId, channel) => {
      console.log(`[UNSUBSCRIBE - ${clientId} -> ${channel}`);
      // this.database.write(() => {
      //   client.active = false;
      // });
    });
  }

  async _publishMessage(change, client) {
    try {
      let record = this.database.findOne(change.recordType, change.recordId);
      if (record) record = objectToJSON(record);
      await this.client.getClient().publish(`/${config.sync.channelOut}/${client.clientId}`, {
        record,
        ...change
      });

      console.log('[MessageOut]', { action: change.action, type: change.recordType, id: change.recordId });
      return {};
    } catch (err) {
      throw new Error(err);
    }
  }

  /**
   * This function is called when a record needs to be saved ( CREATE or UPDATE ) to the database
   * after being synced ( data sent from another client )
   * CREATE: we simply use the data sent from client to create a new record using recordType
   * UPDATE: we compare modifiedFields using timestamps and use a last updated value for that field. Only the fields that are updated will be sent to the database
   * @param {object} options Options passed to the function i-e record, recordType
   */
  _saveRecord(options) {
    try {
      // Check if record exists
      let newRecord = { _id: options.record._id };
      const record = this.database.findOne(options.recordType, options.record._id);
      if (record) { // UPDATE
        // Resolve conflicts
        const modifiedFields = JSON.parse(record.modifiedFields);
        const newModifiedFields = JSON.parse(options.record.modifiedFields);
        each(newModifiedFields, (value, key) => {
          console.log({ value, key }, has(newModifiedFields, key));
          if (has(newModifiedFields, key)) {
            newRecord[key] = modifiedFields[key] > newModifiedFields[key] ? record[key] : options.record[key];
          } else {
            newRecord[key] = options.record[key];
          }
        });
      } else { // CREATE
        newRecord = options.record;
      }

      this.database.write(() => {
        this.database.create(options.recordType, newRecord, true);
      });
    } catch (err) {
      throw err;
    }
  }

  /**
   *  This function deletes a record from the database after just being synced ( sent from another client )
   * @param {options} options Options include recordType and recordId
   */
  _removeRecord(options) {
    this.database.write(() => {
      this.database.deleteByPrimaryKey(options.recordType, options.recordId);
    });
  }
}

module.exports = Sync;
