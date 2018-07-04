import Promise from 'bluebird';
import nano from 'nano';
import to from 'await-to-js';

class Replication {
  constructor() {
    const couchUrl = `http://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASS}@${process.env.COUCHDB_HOST}:${process.env.COUCHDB_PORT}`;
    this.replicatorDB = Promise.promisifyAll(nano(`${couchUrl}/_replicator`));
    this.docName = 'main-to-remote-replicate';
    this.replicationDoc = {
      source: {
        headers: {
          Authorization: 'Basic Y291Y2hhZG1pbjp0ZXN0'
        },
        url: 'http://127.0.0.1:5984/main'
      },
      target: {
        headers: {},
        url: `${process.env.COUCHDB_MAIN_SERVER}/main`
      },
      create_target: false,
      continuous: true,
      owner: 'couchadmin'
    };
  }

  async setup() {
    console.log('replicator - setup');
    let [err, doc] = await to(this.replicatorDB.getAsync(this.docName));
    if (err && err.statusCode === 404) [err, doc] = await to(this.replicatorDB.insertAsync(this.replicationDoc, this.docName));
    if (err) console.error('Error: ', err);
  }
}

export default Replication;
