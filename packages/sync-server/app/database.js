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
    data,
    ...metadata
  } = syncRecord;
  const {
    id,
    ...additionalData
  } = syncRecord.data;

  return {
    ...metadata,
    _id: id,
    data: additionalData,
  };
};

const convertToSyncRecordFormatFromNedb = (nedbRecord) => {
  const {
    _id,
    data,
    channel,
    index,
    ...metadata
  } = nedbRecord;

  return {
    ...metadata,
    data: {
      id: _id,
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

  remove(filter) {
    return new Promise((resolve, reject) => {
      this.nedbStore.remove(filter, { multi: true }, (err, numRemoved) => {
        if(err) {
          reject(err)
        } else {
          resolve(numRemoved);
        }
      });
    });
  }
  
  async insert(channel, syncRecord) {
    const index = await new Promise((resolve, reject) => {
      this.nedbStore.count({ channel }, (err, count) => {
        if(err) {
          reject(err);
        } else {
          resolve(count);
        }
      });
    });

    const recordToStore = {
      channel,
      index,
      lastSynced: (new Date()).valueOf(),
      ...convertToNedbFromSyncRecordFormat(syncRecord)
    };

    return new Promise((resolve, reject) => {
      this.nedbStore.update(
        { _id: recordToStore._id, channel }, 
        recordToStore, 
        { upsert: true }, 
        (err, count, newDoc) => {
          if(err) {
            reject(err);
          } else {
            resolve(count);
          }
        });
    });
  }

  async countSince(channel, since) {
    const stamp = this.convertStringToTimestamp(since);

    return new Promise((resolve, reject) => {
      this.nedbStore.count({
          channel,
          lastSynced: {
            $gt: stamp,
          }
        },
        (err, count) => {
          if(err) {
            reject(err);
          } else {
            resolve(count);
          }
        }
      );
    });
  }
  
  async findSince(channel, since, { limit, offset }= {}) {
    const stamp = this.convertStringToTimestamp(since);

    return new Promise((resolve, reject) => {
      this.nedbStore.find({
          channel,
          lastSynced: {
            $gt: stamp,
          }
        })
        .sort({ lastSynced: 1, index: 1 })
        .skip(offset)
        .limit(limit)
        .exec((err, docs) => {
          if(err) {
            reject(err);
          } else {
            resolve(docs.map(convertToSyncRecordFormatFromNedb));
          }
        });
    });
  }

}

let nedbConnection = null; 

export function initDatabase({ testMode = false }) {
  // connect to database
  const { username, password, name, nedbPath } = config.db;

  if (testMode || nedbPath) {
    if(nedbConnection) {
      return nedbConnection;
    }
    const path = nedbPath;
    log.info(`Connecting to nedb database at ${path}...`);
    nedbConnection = {
      store: new NedbWrapper(path, testMode),
    };
    return nedbConnection;
  } else {
    log.info(`Connecting to mongo database ${username}@${name}...`);
    throw new Error("Mongo DB support is not yet implemented");
  }
}
