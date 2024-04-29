// Copied from Tupaia

import PGPubSub from 'pg-pubsub';
import { log } from './logging';
import shortid from 'shortid';

export class DatabaseChangeChannel extends PGPubSub {
  constructor(dbOptions, logger = log.info) {
    super(dbOptions, { log: logger });
    this.pingListeners = {};
    this.addChannel('ping', this.notifyPingListeners);
  }

  async close() {
    return super.close();
  }

  addDataChangeHandler(handler) {
    this.addChannel('change', handler);
  }

  async publishRecordUpdates(recordType, records, specificHandlerKey) {
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      await this.publish('change', {
        record_id: record.id,
        type: 'update',
        record_type: recordType,
        handler_key: specificHandlerKey,
        old_record: record,
        new_record: record,
      });
    }
  }

  /**
   * Sends a ping request out to the database and listens for a response
   * @param {number} timeout - default 250ms
   * @param {number} retries - default 240 (i.e. 1 minute total wait time). Set to 0 for unlimited retries
   */
  async ping(timeout = 250, retries = 240) {
    return new Promise((resolve, reject) => {
      let tries = 0;
      let nextRequest;
      const id = shortid();
      this.pingListeners[id] = result => {
        delete this.pingListeners[id];
        clearTimeout(nextRequest);
        resolve(result);
      };

      const pingRequest = () => {
        this.publish('ping', true);
        if (retries === 0 || tries < retries) {
          nextRequest = setTimeout(pingRequest, timeout);
        } else {
          delete this.pingListeners[id];
          reject(new Error(`pubsub ping timed out after ${tries} attempts of ${timeout}ms`));
        }
        tries++;
      };

      pingRequest();
    });
  }

  notifyPingListeners(result) {
    Object.values(this.pingListeners).forEach(listener => {
      listener(result);
    });
  }
}
