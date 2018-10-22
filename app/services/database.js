const Realm = require('realm');
const shortId = require('shortid');
const Settings = require('./settings');

class Database extends Realm {
  constructor(...props) {
    super(...props);
    this.realm = null;
    this.settings = new Settings(this);
  }

  getInstance() {
    return this.realm;
  }

  create(type, object, ...args) {
    const objectWithId = {
      _id: shortId.generate(),
      ...object,
    };
    return super.create(type, objectWithId, ...args);
  }

  update(type, object, ...args) {
    const objectWithId = {
      _id: shortId.generate(),
      ...object, // If object already has id, it will be used rather than the one generated above
    };
    return super.update(type, objectWithId, ...args);
  }

  /**
  * Returns the database object with the given id, if it exists, or creates a
  * placeholder with that id if it doesn't.
  * @param  {string} type             The type of database object
  * @param  {string} primaryKey       The primary key of the database object, usually its id
  * @param  {string} primaryKeyField  The field used as the primary key, defaults to 'id'
  * @return {Realm.object}            Either the existing database object with the given
  *                                   primary key, or a placeholder if none
  */
  getOrCreate(type, primaryKey, primaryKeyField = '_id') {
    const object = { [primaryKeyField]: primaryKey };
    return this.update(type, object);
  }

  deleteByPrimaryKey(type, primaryKey, primaryKeyField = '_id') {
    const deleteResults = this.objects(type).filtered(`${primaryKeyField} == $0`, primaryKey);
    if (deleteResults && deleteResults.length > 0) this.delete(deleteResults[0]);
  }

  findOne(type, searchKey, searchKeyField = '_id') {
    if (!searchKey || searchKey.length < 1) throw new Error('Cannot find without a search key');
    const results = super.objects(type).filtered(`${searchKeyField} == $0`, searchKey);
    if (results.length > 0) return results[0];
    return null;
  }

  find(type, condition = null) {
    const item = this.objects(type);
    if (condition) item.filtered(condition);
    return item;
  }

  setSettings(settings) {
    Object.entries(settings).forEach(([key, value]) => this.setSetting(key, value));
  }

  setSetting(key, value = '') {
    return this.settings.set(key, value);
  }

  getSettings(settingsKeys) {
    const settings = {};
    settingsKeys.forEach((settingKey) => {
      settings[settingKey] = this.getSetting(settingKey);
    });
    return settings;
  }

  getSetting(key) {
    return this.settings.get(key);
  }

  deleteSettings(keys) {
    keys.forEach(key => this.deleteSetting(key));
  }

  deleteSetting(key) {
    return this.settings.delete(key);
  }
}

module.exports = Database;
