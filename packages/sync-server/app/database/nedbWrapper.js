import Datastore from 'nedb';

import { getUUIDGenerator } from './uuid';

//----------------------------------------------------------
// The NEDB data store expects things in a slightly different format for ease
// of querying and record duplication - handle that at the point of read/write
const convertToNedbFromSyncRecordFormat = (syncRecord) => {
  if(!syncRecord) return null;

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
  if(!nedbRecord) return null;

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

export class NedbWrapper {

  constructor(path, testMode) {
    this.idGenerator = getUUIDGenerator(testMode);
    this.nedbStore = new Datastore({ filename: path, autoload: true });
  }

  convertStringToTimestamp(s) {
    if(isNaN(s)) {
      // TODO: try parsing it as a date
      return 0;
    }

    return parseInt(s, 10);
  }

  remove(channel, filter) {
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

  async findUser(email) {
    return new Promise((resolve, reject) => {
      this.nedbStore.findOne(
        { channel: 'user', 'data.email': email },
        (err, doc) => err 
          ? reject(err)
          : resolve(convertToSyncRecordFormatFromNedb(doc))
      );
    });
  }
  
  async findUserById(id) {
    return new Promise((resolve, reject) => {
      this.nedbStore.findOne(
        { channel: 'user', '_id': id },
        (err, doc) => err 
          ? reject(err) 
          : resolve(convertToSyncRecordFormatFromNedb(doc))
      );
    });
  }
  
}
