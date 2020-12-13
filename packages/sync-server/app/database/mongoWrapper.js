import { MongoClient } from 'mongodb';
import { getUUIDGenerator } from './uuid';

const convertToMongoFromSyncRecordFormat = (syncRecord) => {
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

const convertToSyncRecordFormatFromMongo = (mongoRecord) => {
  const {
    _id,
    data,
    channel,
    index,
    ...metadata
  } = mongoRecord;

  return {
    ...metadata,
    data: {
      id: _id,
      ...data,
    }
  };
};

function connect(url, dbName) {
  return new Promise((resolve, reject) => {
    MongoClient.connect(url, {
      useUnifiedTopology: true,
    }, (err, client) => {
      if(err) {
        reject(err);
      } else {
        const db = client.db(dbName);
        resolve({
          client,
          db,
        });
      }
    });
  });
}

export class MongoWrapper {

  constructor(path, dbName, testMode) {
    this.collectionName = 'test';
    this.idGenerator = getUUIDGenerator(testMode);

    this.connectionTask = connect(path, dbName);
  }

  async close() {
    const { client } = await this.connectionTask;
    return client.close();
  }

  async getCollection(name) {
    const { db } = await this.connectionTask;
    return db.collection(name);
  }

  convertStringToTimestamp(s) {
    if(isNaN(s)) {
      // TODO: try parsing it as a date
      return 0;
    }

    return parseInt(s, 10);
  }

  async remove(channel, filter) {
    const collection = await this.getCollection(channel);
    return new Promise((resolve, reject) => {
      collection.deleteMany(filter, (err, result) => {
        if(err) {
          reject(err)
        } else {
          resolve(result.result.n);
        }
      });
    });
  }

  async insert(channel, syncRecord) {
    const collection = await this.getCollection(channel);
    const index = await new Promise((resolve, reject) => {
      collection.countDocuments({ channel }, (err, count) => {
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
      ...convertToMongoFromSyncRecordFormat(syncRecord)
    };

    recordToStore._id = recordToStore._id || this.idGenerator();

    return new Promise((resolve, reject) => {
      collection.updateOne(
        { _id: recordToStore._id, channel },
        { $set: recordToStore },
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
    const collection = await this.getCollection(channel);

    return new Promise((resolve, reject) => {
      collection.countDocuments({
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
    const collection = await this.getCollection(channel);

    return new Promise((resolve, reject) => {
      let cursor = collection.find({
          channel,
          lastSynced: {
            $gt: stamp,
          }
        })
        .sort({ lastSynced: 1, index: 1, "data.id": 1 });
      if (offset) {
        cursor = cursor.skip(offset);
      }

      if (limit) {
        cursor = cursor.limit(limit);
      }

      cursor.toArray((err, docs) => {
          if(err) {
            reject(err);
          } else {
            resolve(docs.map(convertToSyncRecordFormatFromMongo));
          }
        });
    });
  }

  async findUser(email) {
    const collection = await this.getCollection('user');

    return new Promise((resolve, reject) => {
      const item = collection.findOne(
        { channel: 'user', 'data.email': email },
        {}, 
        (error, item) => error 
          ? reject(error) 
          : resolve(convertToSyncRecordFormatFromMongo(item))
      );
    });
  }

  async findUserById(id) {
    const collection = await this.getCollection('user');

    return new Promise((resolve, reject) => {
      const item = collection.findOne(
        { '_id': id },
        {}, 
        (error, item) => error 
          ? reject(error) 
          : resolve(convertToSyncRecordFormatFromMongo(item))
      );
    });
  }

  async markRecordDeleted(channel, id) {
    const collection = await this.getCollection('test');
    const { result } = await collection.update(
      { channel, _id: id },
      {
        $unset: { data: true },
        $set: {
          lastSynced: new Date().valueOf(),
          isDeleted: true,
        },
      },
    );
    return result.nModified;
  }
}
