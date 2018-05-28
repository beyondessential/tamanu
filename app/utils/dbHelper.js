import PouchDB from 'pouchdb';
import Backbone from 'backbone-associations';
import BackbonePouch from 'backbone-pouch';
import createPouchViews from '../utils/pouch-views';

const dbHost = 'localhost';
const dbPort = 5984;
const dbUser = 'couchadmin';
const dbPassword = 'test';
let configDB = `http://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/config`;
let patientDB = `http://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/main`;

configDB = new PouchDB(configDB);
patientDB = new PouchDB(patientDB);

// Generate views
createPouchViews(patientDB);

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
