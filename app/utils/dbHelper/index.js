import PouchDB from 'pouchdb';
import Backbone from 'backbone-associations';
import BackbonePouch from 'backbone-pouch';
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

// Backbone.sync = adaptor;
Backbone.Model.prototype.idAttribute = '_id';

module.exports = { configDB, patientDB };
