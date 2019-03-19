/**
 * Maintains storage of application settings. Takes in a realm database in the
 * constructor, which should have a 'Setting' table in the schema as exported
 * above. If no database is passed in, one will be constructed with a Setting
 * table only.
 */
export default class Settings {
  constructor(database, defaults = {}) {
    this.database = database;
    this.defaults = defaults;
    this.addDefaults();
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

  addDefaults() {
    this.database.write(() => {
      Object.keys(this.defaults).forEach(key => {
        const value = this.defaults[key];
        const record = this.database.findOne('setting', key, 'key');
        if (!record || record.value === '') this.database.create('setting', { key, value }, true);
      });
    });
  }
}
