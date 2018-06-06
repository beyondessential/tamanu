import PouchDB from 'pouchdb';
import Backbone from 'backbone-associations';
import BackbonePouch from 'backbone-pouch';
import { defaults } from 'lodash';
import createViews from './createViews';
import createIndex from './createIndex';

// Attach pocuhdb find plugin
PouchDB.plugin(require('pouchdb-find'));

const dbHost = 'localhost';
const dbPort = 5984;
const dbUser = 'couchadmin';
const dbPassword = 'test';
let configDB = `http://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/config`;
let patientDB = `http://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/main`;

configDB = new PouchDB(configDB);
patientDB = new PouchDB(patientDB);

// Generate index & views
createIndex(patientDB);
createViews(patientDB);

Backbone.sync = BackbonePouch.sync({
  db: patientDB,
  fetch: 'allDocs',
  options: {
    allDocs: {
      include_docs: true,
      limit: 10
    }
  }
});

// Add promise support to backbone model
const originalSave = Backbone.Model.prototype.save;
Backbone.Model.prototype.save = function saveData(data, options) {
  return new Promise((resolve, reject) => {
    const newOptions = defaults({
      success: resolve,
      error: reject
    }, options);

    originalSave.apply(this, [data, newOptions]);
  });
};

const originalFetch = Backbone.Model.prototype.fetch;
Backbone.Model.prototype.fetch = function fetchData(options) {
  return new Promise((resolve, reject) => {
    const newOptions = defaults({
      success: resolve,
      error: reject
    }, options);

    originalFetch.apply(this, [newOptions]);
  });
};

const originalDestroy = Backbone.Model.prototype.destroy;
Backbone.Model.prototype.destroy = function destroyData(options) {
  return new Promise((resolve, reject) => {
    const newOptions = defaults({
      success: resolve,
      error: reject
    }, options);

    originalDestroy.apply(this, [newOptions]);
  });
};

// Backbone.sync = adaptor;
Backbone.Model.prototype.idAttribute = '_id';

module.exports = { configDB, patientDB };
