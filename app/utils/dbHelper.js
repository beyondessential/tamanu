import Promise from 'bluebird';
import nano from 'nano';
import PouchDB from 'pouchdb';
import Backbone from 'backbone';
import BackbonePouch from 'backbone-pouch';

const dbHost = 'localhost';
const dbPort = 5984;
const dbUser = 'couchadmin';
const dbPassword = 'test';
let configDB = `http://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/config`;
let patientDB = `http://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/patient`;

configDB = new PouchDB(configDB);
patientDB = new PouchDB(patientDB);

Backbone.sync = BackbonePouch.sync({
  db: patientDB,
  fetch: 'allDocs',
  options: {
    allDocs: {
      include_docs: true,
      limit: 10
    },
    query: {
      include_docs: true,
      limit: 10
    }
  }
});
Backbone.Model.prototype.idAttribute = '_id';

module.exports = { configDB, patientDB };
