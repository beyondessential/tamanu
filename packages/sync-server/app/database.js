import config from 'config';

import { v4 as uuid } from 'uuid';

import Datastore from 'nedb';

import { log } from './logging';

// make a 'fake' uuid that looks like 'test-766-9794-4491-8612-eb19fd959bf2'
// this way we can run tests against real data and clear out everything that was
// created by the tests with just "DELETE FROM table WHERE id LIKE 'test-%'"
const createTestUUID = () => `test-${uuid().slice(5)}`;

//----------------------------------------------------------
// The NEDB data store expects things in a slightly different format for ease
// of querying and record duplication - handle that at the point of read/write
const convertToNedbFromSyncRecordFormat = (syncRecord) => {
  const {
    id,
    lastModified,
    ...additionalData
  } = syncRecord.data;

  return {
    _id: id,
    lastModified: lastModified.valueOf(),
    data: additionalData,
    recordType: syncRecord.recordType,
  };
};

const convertToSyncRecordFormatFromNedb = (nedbRecord) => {
  const {
    _id,
    lastModified,
    data,
    recordType,
  } = nedbRecord;

  return {
    recordType,
    data: {
      id: _id,
      lastModified,
      ...data,
    }
  };
};

//----------------------------------------------------------

class NedbWrapper {

  constructor(path, testMode) {
    this.idGenerator = testMode ? createTestUUID : () => uuid();
    this.nedbStore = new Datastore({ filename: path, autoload: true });
  }

  convertStringToTimestamp(s) {
    if(isNaN(s)) {
      // TODO: try parsing it as a date
      return 0;
    }

    return parseInt(s, 10);
  }
  
  async insert(channel, syncRecord) {
    const recordToStore = convertToNedbFromSyncRecordFormat(syncRecord);

    return new Promise((resolve, reject) => {
      this.nedbStore.update(
        { _id: recordToStore._id, }, 
        recordToStore, 
        { upsert: true }, 
        (err, count, newDoc) => {
          if(err) {
            reject(err);
          } else {
            resolve();
          }
        });
    });
  }

  async findSince(channel, since) {
    const stamp = this.convertStringToTimestamp(since);

    return new Promise((resolve, reject) => {
      this.nedbStore.find({
        lastModified: {
          $gt: stamp,
        }
      }, (err, docs) => {
        if(err) {
          reject(err);
        } else {
          resolve(docs.map(convertToSyncRecordFormatFromNedb));
        }
      });
    });
  }

}

export function initDatabase({ testMode = false }) {
  // connect to database
  const { username, password, name, nedbPath } = config.db;

  if (testMode || nedbPath) {
    const path = testMode ? 'data/test.db' : nedbPath;
    log.info(`Connecting to nedb database at ${path}...`);
    const store = new NedbWrapper(path, testMode);
    return { 
      store
    };
  } else {
    log.info(`Connecting to mongo database ${username}@${name}...`);
    throw new Error("Mongo DB support is not yet implemented");
  }
}
