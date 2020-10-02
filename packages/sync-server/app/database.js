import config from 'config';

import { v4 as uuid } from 'uuid';

import Datastore from 'nedb';

import { log } from './logging';

// make a 'fake' uuid that looks like 'test-766-9794-4491-8612-eb19fd959bf2'
// this way we can run tests against real data and clear out everything that was
// created by the tests with just "DELETE FROM table WHERE id LIKE 'test-%'"
const createTestUUID = () => `test-${uuid().slice(5)}`;

const removeIdUnderscore = ({ _id, ...rest }) => ({ id: _id, ...rest });

class NedbWrapper {

  constructor(path, testMode) {
    this.idGenerator = testMode ? createTestUUID : () => uuid();
    this.store = new Datastore({ filename: path, autoload: true });
  }
  
  async insert(channel, data) {
    // rename id to _id
    const { 
      id = this.idGenerator(),
      ...rest
    } = data;
    const doc = {
      _id: id,
      ...rest,
    };

    return new Promise((resolve, reject) => {
      this.store.insert(doc, (err, newDoc) => {
        if(err) {
          reject(err);
        } else {
          resolve(removeIdUnderscore(newDoc));
        }
      });
    });
  }

  async find(channel, params) {
    return new Promise((resolve, reject) => {
      this.store.find(params, (err, docs) => {
        if(err) {
          reject(err);
        } else {
          resolve(docs.map(removeIdUnderscore));
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
    return { store };
  } else {
    log.info(`Connecting to mongo database ${username}@${name}...`);
    throw new Error("Mongo DB support is not yet implemented");
  }
}
