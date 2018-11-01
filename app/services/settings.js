/**
 * Maintains storage of application settings. Takes in a realm database in the
 * constructor, which should have a 'Setting' table in the schema as exported
 * above. If no database is passed in, one will be constructed with a Setting
 * table only.
 */
const { each } = require('lodash');
const shortid = require('shortid');

const defaults = {
  LAST_SYNC_IN: '0',
  LAST_SYNC_OUT: '0',
  CLIENT_ID: shortid.generate(),
  CLIENT_SECRET: '',
  TEMP_DISPLAY_ID_SEQ: '0'
};

class Settings {
  constructor(database) {
    this.database = database;
    this._addDefaults();
  }

  set(key, value) {
    this.database.write(() => {
      this.database.create('setting', {
        key,
        value: value.toString(),
      }, true);
    });
  }

  delete(key) {
    this.database.write(() => {
      const results = this.database.objects('setting').filtered('key == $0', key);
      if (results && results.length > 0) {
        const setting = results[0];
        this.database.delete('setting', setting);
      }
    });
  }

  get(key) {
    const results = this.database.objects('setting').filtered('key == $0', key);
    if (results && results.length > 0) return results[0].value;
    return ''; // Return empty string if no setting with the given key
  }

  _addDefaults() {
    this.database.write(() => {
      each(defaults, (value, key) => {
        const record = this.database.findOne('setting', key, 'key');
        if (!record || record.value === '') this.database.create('setting', { key, value }, true);
      });
    });
  }
}

module.exports = Settings;
