import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';

PouchDB.plugin(PouchDBFind); // install the pouchdb-find plugin

export const dbHelpers = {
  patientDB: new PouchDB(
    'http://localhost:5984/patient',
    {
      auth: {
        username: 'couchadmin',
        password: 'test'
      }
    }
  ),
};
