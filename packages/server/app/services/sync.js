/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-unresolved */
import config from 'config';
import {
  has, isEmpty, toLower, pick, keys, set, isFunction, chain, difference,
} from 'lodash';
import moment from 'moment';
import { to } from 'await-to-js';
import { defaults as defaultFields } from 'Shared/schemas';
import {
  objectToJSON, parseObjectForSync, incoming, findSchema,
} from '../utils';
import AuthService from './auth';
const {
  HTTP_METHOD_TO_ACTION, ENVIRONMENT_TYPE, SYNC_ACTIONS,
} = require('../constants');

export default class Sync {
  constructor(database, faye, queueManager) {
    this.database = database;
    this.client = faye;
    this.queueManager = queueManager;
    this.auth = new AuthService(database);
    this.client.addExtension({
      incoming: (message, callback) => incoming({ database, message, callback }),
    });
  }

  async synchronize() {
    const fromTime = moment().subtract(30, 'minutes').toDate().getTime();
    const clients = this.database.find('client', `lastActive > ${fromTime}`);
    const [err] = await to(Promise.all(clients.map(client => this.sync(client))));
    if (err) throw err;
  }

  async sync(client) {
    try {
      const { syncOut: lastSyncTime, hospitalId } = client;
      const changes = this.database.find('change', `timestamp > "${lastSyncTime}"`);
      if (changes && changes.length > 0) {
        const hospital = this.database.findOne('hospital', hospitalId);
        const maxTimestamp = changes.max('timestamp');
        const [err] = await to(Promise.all(changes.map(change => this.publishMessage(
          objectToJSON(change),
          client,
          hospital,
        ))));
        if (err) return new Error(err);

        // Update sync date
        this.database.write(() => {
          // eslint-disable-next-line no-param-reassign
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
          case SYNC_ACTIONS.SAVE:
            this.saveRecord(message);
            break;
          case SYNC_ACTIONS.REMOVE:
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

    this.client.on('unsubscribe', (client, channel) => {
      const channelSections = channel.split('/');
      const clientId = channelSections.pop();
      this.disconnectClients(`clientId = '${clientId}'`);
      console.log(`[UN-SUBSCRIBE - ${clientId}] -> ${channel}`);
    });
  }

  disconnectClients(condition = 'lastActive != 0') {
    const activeClients = this.database.find('client', condition);
    this.database.write(() => {
      activeClients.forEach((client) => {
        // eslint-disable-next-line no-param-reassign
        if (client) client.lastActive = 0;
      });
    });
  }

  async publishMessage(change, client, hospital) {
    try {
      let record = this.database.findOne(change.recordType, change.recordId);
      const schema = findSchema(change.recordType);
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
        if (record) record = parseObjectForSync(record);
        // Apply selectors  if defined
        if (toLower(change.action) === 'save') {
          record = this.applySelectors(schema, hospital, change, record);
          // Reset modified fields
          record.modifiedFields = [];
        }
        // if (record._id === 'hospital-demo-10') console.log('-out-', { users: record.users });
        await this.client.getClient().publish(`/${config.sync.channelOut}/${client.clientId}`, {
          record,
          ...change,
        });

        console.log('[MessageOut]', { action: change.action, type: change.recordType, id: change.recordId });
        return true;
      }

      throw Error(`Error: Schema not found ${change.recordType}`);
    } catch (err) {
      throw new Error(err);
    }
  }

  applySelectors = (schema, hospital, change, record) => {
    let filteredRecord = record;
    filteredRecord.fullySynced = false; // reset
    if (schema.selectors && !isEmpty(schema.selectors)) {
      const key = `${change.recordType}-${change.recordId}`;
      const objectsFullySynced = Array.from(hospital.objectsFullySynced);
      if (objectsFullySynced.includes(key)) filteredRecord.fullySynced = true;

      // Send selected fields only
      if (!filteredRecord.fullySynced) {
        const selectedFields = ['_id', ...keys(defaultFields), ...schema.selectors];
        filteredRecord = pick(filteredRecord, selectedFields);
        filteredRecord.fullySynced = false; // just to make sure
      }
    } else {
      filteredRecord.fullySynced = true;
    }
    return filteredRecord;
  }

  /**
   * This function is called when a record needs to be saved ( CREATE or UPDATE ) to the database
   * after being synced ( data sent from another client )
   * CREATE: we simply use the data sent from client to create a new record using recordType
   * UPDATE: we compare modifiedFields using timestamps and use a last updated value for
   *         that field. Only the fields that are updated will be sent to the database
   * @param {from, record, action, recordId, recordType, timestamp} options Options passed to the function
   */
  saveRecord({ record: updatedRecord, recordType }) {
    try {
      // check if record exists
      const schema = findSchema(recordType);
      let newRecord = { _id: updatedRecord._id }; // eslint-disable-line no-underscore-dangle
      let currentRecord = this.database.find(recordType, `_id = '${updatedRecord._id}'`); // eslint-disable-line no-underscore-dangle
      if (currentRecord) {
        [currentRecord] = currentRecord.slice(0, 1);
      }
      const action = currentRecord ? HTTP_METHOD_TO_ACTION.PUT : HTTP_METHOD_TO_ACTION.POST;

      // resolve conflicts
      if (recordType !== 'modifiedField') {
        newRecord = this.mergeChanges(currentRecord, updatedRecord, recordType, action, newRecord);
      } else {
        newRecord = updatedRecord;
      }
      // trigger `beforeSave` event
      if (isFunction(schema.beforeSave)) {
        newRecord = schema.beforeSave(this.database, newRecord, ENVIRONMENT_TYPE.SERVER);
      }
      // fix relations
      newRecord = this.serializeRelations(newRecord);
      // only add / update record if some authorized data is present
      if (Object.keys(newRecord).length > 1) {
        this.updateRecord({ recordType, newRecord, currentRecord });
      }
    } catch (err) {
      // console.error(err);
      throw err;
    }
  }

  serializeRelations = newRecord => {
    Object.keys(newRecord).forEach(field => {
      if (field === 'modifiedFields' || field === 'objectsFullySynced') return;
      const value = newRecord[field];
      if (Array.isArray(value)) {
        const newValue = value.map(({ _id }) => ({ _id }));
        set(newRecord, field, newValue);
      } else if (typeof value === 'object') {
        set(newRecord, field, pick(value, ['_id']));
      }
    });

    return newRecord;
  }

  mergeChanges(currentRecord = {}, updatedRecord, recordType, action, record) {
    const newRecord = record;
    let { modifiedFields: currentModifiedFields = [] } = currentRecord;
    const { modifiedFields: updatedModifiedFields = [] } = updatedRecord;
    if (currentModifiedFields) currentModifiedFields = Array.from(currentModifiedFields);

    updatedModifiedFields.forEach(({ time: updateTime, token, field }) => {
      const tokenPayload = this.auth.verifyJWTToken(token);

      if (tokenPayload !== false) {
        const { userId, hospitalId } = tokenPayload;
        const fields = updatedModifiedFields.map(({ field: f }) => f);
        const subject = recordType;
        const user = userId;
        const validPermissions = this.auth.validatePermissions({
          user, hospitalId, action, subject, fields,
        });

        if (validPermissions) { // TODO: add generous relations update
          if (has(currentModifiedFields, field)) { // if key already has an old value stored
            const lastUpdatedValue = updateTime > currentModifiedFields[field].time
              ? updatedRecord[field] : currentRecord[field];
            newRecord[field] = lastUpdatedValue;
          } else { // Set the new value
            newRecord[field] = updatedRecord[field];
          }
        } else {
          console.error(`Invalid permissions, [${action}-${subject}] !`);
        }
      } else {
        console.error(`Save data request rejected, invalid sync token[${token}] !`);
      }
    });

    // set the latest modified fields
    if (Object.keys(newRecord).length > 1) {
      newRecord.modifiedFields = chain([...currentModifiedFields, ...updatedModifiedFields])
        .sortBy('_id')
        .reverse()
        .uniqBy('_id')
        .value();
    }

    return newRecord;
  }

  updateRecord({ recordType, currentRecord = {}, newRecord }) {
    // get new item added to `objectsFullySynced`
    let { objectsFullySynced: oldSyncedItems = [] } = currentRecord;
    let { objectsFullySynced: newSyncedItems = [] } = newRecord;
    // parse
    oldSyncedItems = Array.from(oldSyncedItems);
    newSyncedItems = Array.from(newSyncedItems);
    // write to db
    this.database.write(() => {
      this.database.create(recordType, newRecord, true);
    });
    // push newly synced items to the client
    if (newRecord.objectsFullySynced) {
      this.pushNewlySyncedItems({ oldSyncedItems, newSyncedItems });
    }
  }

  pushNewlySyncedItems({ oldSyncedItems, newSyncedItems }) {
    const newlyAdded = difference(newSyncedItems, oldSyncedItems);
    newlyAdded.forEach((item) => {
      const [recordType, recordId] = item.split(/-(.+)/);
      this.queueManager.push({
        action: SYNC_ACTIONS.SAVE,
        recordId,
        recordType,
      });
    });
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
