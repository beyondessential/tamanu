import Promise from 'bluebird';
import { to } from 'await-to-js';
import { startsWith, each } from 'lodash';
import dbService from '../services/database';

class Config {
  constructor() {
    this.configDB = null;
  }

  async setup() {
    this._loadDB();
    return new Promise(async (resolve, reject) => {
      const docs = [];
      const defaults = {
        config_push_subscription_id: ''
      };
      each(defaults, (value, _id) => docs.push({ _id, value }));
      const [err, res] = await to(this.configDB.bulkDocs(docs));
      if (err) return reject(err);
      return resolve(res);
    });
  }

  _loadDB() {
    if (this.configDB === null) {
      this.configDB = dbService.configDB;
    }
  }

  save(key, value) {
    return new Promise(async (resolve, reject) => {
      if (!startsWith(key, 'config_')) key = `config_${key}`;
      const doc = { _id: key, value };
      let [err, res] = await to(this.configDB.get(key));
      if (typeof res !== 'undefined') doc._rev = res._rev;

      [err, res] = await to(this.configDB.put(doc));
      if (err) return reject(err);
      return resolve(res);
    });
  }

  get(key) {
    return new Promise(async (resolve, reject) => {
      if (!startsWith(key, 'config_')) key = `config_${key}`;
      const [err, res] = await to(this.configDB.get(key));
      if (err) return reject(err);
      return resolve(res.value);
    });
  }
}

const config = new Config();
export default config;
