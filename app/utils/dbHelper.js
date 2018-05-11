import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';

PouchDB.plugin(PouchDBFind); // install the pouchdb-find plugin

const localDB = new PouchDB(
  'http://localhost:5984/tamanu',
  {
    auth: {
      username: 'couchadmin',
      password: 'test'
    }
  }
);

export const dbHelpers = {
  localDB,
};
