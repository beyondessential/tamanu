import Promise from 'bluebird';
import nano from 'nano';
import to from 'await-to-js';

class Replication {
  constructor() {
    this.serverUrl = 'http://localhost:3500/main123';
    // this.localUrl = `http://${this.dbUser}:${this.dbPassword}@${this.dbHost}:${this.dbPort}`;
    this.replicatorDB = Promise.promisifyAll(nano('http://couchadmin:test@localhost:5984/_replicator'));
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
        url: 'http://localhost:3500/main'
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
