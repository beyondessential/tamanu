const Realm = require('realm');
const config = require('config');
const shortId = require('shortid');
const { has, head } = require('lodash');
const Settings = require('./settings');
const { schemas, version: schemaVersion } = require('../../../shared/schemas');
const { SYNC_ACTIONS } = require('../constants');

class Database extends Realm {
  constructor(...props) {
    super(...props);
    this.settings = new Settings(this);
    this.listeners = {};
  }

  create(type, object, update = false, silent = false) {
    const objectWithId = {
      _id: shortId.generate(),
      ...object,
    };

    if (update) objectWithId.modifiedAt = new Date();
    const result = super.create(type, objectWithId, update);
    if (!silent) this._alertListeners(SYNC_ACTIONS.SAVE, type, result);
    return result;
  }

  update(type, object, silent = false) {
    const objectWithId = {
      _id: shortId.generate(),
      modifiedAt: new Date(),
      ...object, // If object already has id, it will be used rather than the one generated above
    };

    const result = super.update(type, objectWithId);
    if (!silent) this._alertListeners(SYNC_ACTIONS.SAVE, type, result);
    return result;
  }

  /**
   * Deletes a specific object from the database.
   * @param  {Realm.Object} object  Object to be deleted, also can accept an array of Objects
   *                                of same type to be deleted.
   * @param  {string} type          Type of the object(s) to be deleted
   * Any extra params are passed directly on to change listeners
   * @return {none}
   */
  delete(object, silent = false) {
    // Test if the object is a RealmObject by checking if it has the function objectSchema(). If it
    // is, stick it in an array. Otherwise, objet is an array, a realm list, or a realm results
    // object, so just slice it to make sure it is a simple array
    const objects = typeof object.objectSchema === 'function' ? [object] : object.slice();

    // If empty, ignore
    if (!objects || objects.length === 0) return;

    // Go through each object, call its destructor, and alert any change listeners
    objects.forEach((obj) => {
      const schema = obj.objectSchema();
      const type = schema.name;
      const record = { _id: obj._id }; // If it is being deleted, only alert with the id
      if (obj && obj.destructor instanceof Function) obj.destructor(this);
      if (!silent) this._alertListeners(SYNC_ACTIONS.REMOVE, type, record);
    });

    // Actually delete the objects from the database
    super.delete(objects);
  }

  /**
   * Deletes all objects from the database.
   * Any params are passed directly on to change listeners
   * @return {none}
   */
  deleteAll(...listenerArgs) {
    super.deleteAll();
    this.alertListeners(SYNC_ACTIONS.WIPE, ...listenerArgs);
  }

  /**
   * Add listener to the database changes
   * @param {string} type Record type
   * @param {func} callback callback function
   */
  addListener(type, callback) {
    this.listeners[type] = callback;
  }

  /**
   * Remove a single database listener
   * @param {string} type Record type
   */
  removeListener(type) {
    delete this.listeners[type];
  }

  /**
   * Remove all database listeners
   */
  removeAllListeners() {
    this.listeners = {};
  }

  /**
   * Calls each callback in the array of listeners with the provided arguments.
   * @param  {array} ...args The arguments to pass on to each callback
   * @return {none}
   */
  _alertListeners(action, type, record) {
    if (has(this.listeners, type)) this.listeners[type](action, record);
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

  deleteByPrimaryKey(type, primaryKey, primaryKeyField = '_id', silent = false) {
    const deleteResults = this.objects(type).filtered(`${primaryKeyField} == $0`, primaryKey);
    if (deleteResults && deleteResults.length > 0) this.delete(deleteResults[0], silent);
  }

  findOne(type, searchKey, searchKeyField = '_id') {
    if (!searchKey || searchKey.length < 1) throw new Error('Cannot find without a search key');
    const results = super.objects(type).filtered(`${searchKeyField} == $0`, searchKey);
    return head(results);
    // console.log()
    // if (results.length > 0) return results[0];
    // return null;
  }

  find(type, condition = '') {
    return this.objects(type).filtered(condition);
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

  getView(key) {
    return this.findOne('view', key, 'name');
  }
}

const database = new Database({
  path: `./data/${config.db.name}.realm`,
  schema: schemas,
  schemaVersion,
});

module.exports = database;
