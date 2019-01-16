const config = require('config');
const {
  each, has, isEmpty, isArray, isObject, mapValues,
  toLower, pick, keys, pickBy
} = require('lodash');
const moment = require('moment');
const { to } = require('await-to-js');
const { objectToJSON, incoming, jsonParse } = require('../utils');
const { schemas, defaults: defaultFields } = require('../../../shared/schemas');

class Sync {
  constructor(database, faye) {
    this.database = database;
    this.client = faye; // new Faye.Client(`http://127.0.0.1:${config.app.port}/${config.syncPath}`);
    this.client.addExtension({
      incoming: (message, callback) => incoming({ database, message, callback })
    });
  }

  async synchronize() {
    const fromTime = moment().subtract(30, 'minutes').toDate().getTime();
    const clients = this.database.find('client', `lastActive > ${fromTime}`);
    const [err] = await to(Promise.all(clients.map(client => this._sync(client))));
    if (err) throw err;
  }

  async _sync(client) {
    try {
      const { syncOut: lastSyncTime, hospitalId } = client;
      const changes = this.database.find('change', `timestamp > "${lastSyncTime}"`);
      if (changes && changes.length > 0) {
        const hospital = this.database.findOne('hospital', hospitalId);
        const maxTimestamp = changes.max('timestamp');
        const [err] = await to(Promise.all(changes.map(change =>
                                this._publishMessage(objectToJSON(change), client, hospital))));
        if (err) return new Error(err);

        // Update sync date
        this.database.write(() => {
          client.syncOut = maxTimestamp || new Date().getTime();
        });
        return true;
      }
      return true;
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
    });
  }

  async _publishMessage(change, client, hospital) {
    try {
      let record = this.database.findOne(change.recordType, change.recordId);
      const schema = schemas.find(_schema => _schema.name === change.recordType);
      if (!isEmpty(schema)) {
        // Apply filter if defined
        if (typeof schema.filter === 'function') {
          const sendItem = schema.filter(record, client, change);
          if (!sendItem) {
            console.log(`Object [${change.recordType} - ${change.recordId}] not authorized to be synced, skipping..`);
            return true;
          }
        }

        // Object to JSON
        if (record) record = objectToJSON(record);

        // Apply selectors  if defined
        if (toLower(change.action) === 'save') {
          record = this._applySelectors(schema, hospital, change, record);
          record = this._pickDefaultFieldsOnly(record);
        }

        // if (record._id === 'hospital-demo-10') console.log('-out-', { users: record.users });
        await this.client.getClient().publish(`/${config.sync.channelOut}/${client.clientId}`, {
          record,
          ...change
        });

        console.log('[MessageOut]', { action: change.action, type: change.recordType, id: change.recordId });
        return true;
      }

      throw Error(`Error: Schema not found ${change.recordType}`);
    } catch (err) {
      throw new Error(err);
    }
  }

  _applySelectors(schema, hospital, change, record) {
    if (schema.selectors && !isEmpty(schema.selectors)) {
      let syncedIds = [];
      let { objectsFullySynced } = hospital;
      objectsFullySynced = jsonParse(objectsFullySynced);
      if (has(objectsFullySynced, change.recordType)) {
        syncedIds = objectsFullySynced[change.recordType];
      }
      console.log({ objectsFullySynced, syncedIds });
      if (syncedIds.includes(change.recordId)) record.fullySynced = true;

      // Send selected fields only
      if (!record.fullySynced) {
        schema.selectors = ['_id', ...keys(defaultFields), ...schema.selectors];
        record = pick(record, schema.selectors);
        record.fullySynced = false; // just to make sure
      }
    } else {
      record.fullySynced = true;
    }
    return record;
  }

  _pickDefaultFieldsOnly(record) {
    record = mapValues(record, (value) => {
      if (isArray(value)) {
        return value.map(_record => pickBy(_record, _value => typeof _value !== 'object'));
      }
      if (isObject(value)) {
        return pickBy(value, _value => typeof _value !== 'object');
      }
      return value;
    });
    return { ...record, modifiedFields: '' };
  }

  /**
   * This function is called when a record needs to be saved ( CREATE or UPDATE ) to the database
   * after being synced ( data sent from another client )
   * CREATE: we simply use the data sent from client to create a new record using recordType
   * UPDATE: we compare modifiedFields using timestamps and use a last updated value for
   *         that field. Only the fields that are updated will be sent to the database
   * @param {object} options Options passed to the function i-e record, recordType
   */
  _saveRecord(options) {
    try {
      // Check if record exists
      let newRecord = { _id: options.record._id };
      const record = this.database.findOne(options.recordType, options.record._id);
      if (record) { // UPDATE
        // Resolve conflicts
        const modifiedFields = jsonParse(record.modifiedFields) || {};
        const newModifiedFields = jsonParse(options.record.modifiedFields) || {};
        each(newModifiedFields, (value, key) => {
          console.log({ value, key }, has(newModifiedFields, key));
          if (has(newModifiedFields, key)) {
            newRecord[key] = modifiedFields[key] > newModifiedFields[key]
                              ? record[key] : options.record[key];
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
   *  This function deletes a record from the database after 
   *  just being synced ( sent from another client )
   * @param {options} options Options include recordType and recordId
   */
  _removeRecord(options) {
    this.database.write(() => {
      this.database.deleteByPrimaryKey(options.recordType, options.recordId);
    });
  }
}

module.exports = Sync;
