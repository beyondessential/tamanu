import Faye from 'faye';
import { find } from 'lodash';
import config from 'config';
import { schemas } from 'shared/schemas';
import { objectToJSON } from '../utils';
import { outgoing } from '../utils/faye-extensions';
import { SYNC_MODES, SYNC_ACTIONS } from '../constants';

export class Sync {
  constructor(database, listeners) {
    this.database = database;
    this.listeners = listeners;
    this.client = new Faye.Client(`${config.mainServer}/${config.sync.path}`);
    this.client.addExtension({
      outgoing: (message, callback) => outgoing({ database, message, callback }),
    });
  }

  setup() {
    const clientId = this.database.getSetting('CLIENT_ID');
    const subscription = this.client
      .subscribe(`/${config.sync.channelIn}/${clientId}`)
      .withChannel((channel, message) => {
        const { action, recordType: type, recordId: id } = message;
        const schema = find(schemas, ({ name }) => name === type);
        if (!schema) {
          throw new Error(`Invalid recordType [${type}]`);
        }
        if (schema.sync !== SYNC_MODES.ON && schema.sync !== SYNC_MODES.REMOTE_TO_LOCAL) {
          throw new Error(`Schema sync not allowed [${schema.sync}]`);
        }
        console.log(`[MessageIn - ${config.sync.channelIn}/${clientId}] - [${channel}]`, {
          action,
          type,
          id,
        });
        switch (message.action) {
          case SYNC_ACTIONS.SAVE:
            this.saveRecord(message);
            break;
          case SYNC_ACTIONS.REMOVE:
            this.removeRecord(message);
            break;
          default:
            throw new Error('No action specified');
        }
      });

    subscription.callback(() => {
      this.synchronize();
      console.log('[SUBSCRIBE SUCCEEDED]');
    });

    subscription.errback(error => {
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
      const changes = this.database
        .find('change', `timestamp >= "${lastSyncTime}"`)
        .sorted('timestamp', false);
      const tasks = [];
      changes.forEach(change => tasks.push(this.publishMessage(objectToJSON(change))));
      Promise.all(tasks);
    } catch (err) {
      throw new Error(err);
    }
  }

  async publishMessage(change) {
    try {
      const clientId = this.database.getSetting('CLIENT_ID');
      let record = this.database.findOne(change.recordType, change.recordId);
      if (record) record = objectToJSON(record);
      await this.client.publish(`/${config.sync.channelOut}`, {
        from: clientId,
        record,
        ...change,
      });

      // // Update last sync out date
      this.database.setSetting('LAST_SYNC_OUT', new Date().getTime());
      console.log('[MessageOut]', `/${config.sync.channelOut}`, {
        action: change.action,
        type: change.recordType,
        id: change.recordId,
      });
    } catch (err) {
      throw new Error(err);
    }
  }

  saveRecord({ record, recordType }) {
    try {
      this.database.write(() => {
        this.database.create(recordType, record, true, true);
      });
    } catch (err) {
      console.error(err.toString(), record);
      throw err;
    }
  }

  removeRecord(props) {
    try {
      this.database.write(() => {
        this.database.deleteByPrimaryKey(props.recordType, props.recordId, '_id', true);
      });
    } catch (err) {
      throw err;
    }
  }
}
