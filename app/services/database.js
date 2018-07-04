import PouchDB from 'pouchdb';
import { defaults } from 'lodash';
import { ipcRenderer } from 'electron';
import Promise from 'bluebird';
import { to } from 'await-to-js';
import {
  START_NOTIFICATION_SERVICE,
  NOTIFICATION_SERVICE_STARTED,
  NOTIFICATION_SERVICE_ERROR,
  NOTIFICATION_RECEIVED as ON_NOTIFICATION_RECEIVED,
  TOKEN_UPDATED,
} from 'electron-push-receiver/src/constants';
import Replication from './replication';
import createViews from '../utils/create-views';
import createIndex from '../utils/create-index';
import backboneSync from '../utils/backbone-sync';
import firebase from '../services/firebase';
import configService from './config';

// Attach pocuhdb find plugin
PouchDB.plugin(require('pouchdb-find'));

class Database {
  constructor() {
    this.senderId = '889083073051';
    this.dbHost = 'localhost';
    this.dbPort = 5984;
    this.dbUser = 'couchadmin';
    this.dbPassword = 'test';
    this.messaging = firebase.messaging();
    this.serverUrl = 'http://localhost:3000/main123';
    this.apiHost = 'http://localhost:3000';
    this.localUrl = `http://${this.dbUser}:${this.dbPassword}@${this.dbHost}:${this.dbPort}`;
    this.replication = new Replication();
    // this.messaging.usePublicVapidKey('BDWzelnx830a2-S3ZqbUAeBHjM3AY05zVIZyWYMmgEO7vRt5MjoSbpyZsMl3zKVoKuo53i9GhThi_5f82IEUd64');
  }

  createDB() {
    return new Promise((resolve, reject) => {
      this.HTTPPouch = PouchDB.defaults({
        // prefix: 'http://localhost:3000/couchProxy/'
        prefix: this.localUrl
      });

      const Timer = setTimeout(() => {
        reject(new Error('Request timed-out!'));
      }, 5000);

      this.HTTPPouch.on('created', (dbName) => {
        if (dbName === 'main') {
          clearTimeout(Timer);
          resolve();
        }
      });

      this.configDB = new this.HTTPPouch('config');
      this.mainDB = new this.HTTPPouch('main');
    });
  }

  setup() {
    // Generate index & views
    createIndex(this.mainDB);
    createViews(this.mainDB);

    // Setup backbone sync
    this.setupSync();
    this.replication.setup();

    // Setup subscriptions
    this.setupSubscription();
  }

  setupSync() {
    backboneSync(this.mainDB);
  }

  setupSubscription() {
    // Listen for service successfully started
    ipcRenderer.on(NOTIFICATION_SERVICE_STARTED, (_, token) => this._saveSubscriptionToken(token));
    ipcRenderer.on(TOKEN_UPDATED, (_, token) => this._saveSubscriptionToken(token));

    // Handle notification errors
    ipcRenderer.on(NOTIFICATION_SERVICE_ERROR, (_, error) => console.error('NOTIFICATION_SERVICE_ERROR', error));

    // Display notification
    ipcRenderer.on(ON_NOTIFICATION_RECEIVED, (_, notification) => console.log('ON_NOTIFICATION_RECEIVED', notification));

    // Start service
    ipcRenderer.send(START_NOTIFICATION_SERVICE, this.senderId);
  }

  async _saveSubscriptionToken(token) {
    let [err, res] = await to(this._sendSubscriptionToServer(token));
    if (!err) [err, res] = await to(configService.save('push_subscription_id', res.id));
    if (err) throw new Error(err);
    console.log('Subscription info sent to the server');
  }

  async _sendSubscriptionToServer(token) {
    return new Promise(async (resolve, reject) => {
      const [err, pushSubscriptionId] = await to(configService.get('push_subscription_id'));
      if (err) return reject(err);

      let url = `${this.apiHost}/subscription`;
      let method = 'POST';
      if (pushSubscriptionId !== '') {
        url += `/${pushSubscriptionId}`;
        method = 'PUT';
      }

      let [error, res] = await to(fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          remoteSeq: 0,
          clientToken: token,
          clientId: 'test-tamanu-app'
        })
      }));

      if (!error) [error, res] = await to(res.json());
      if (error) return reject(error);
      return resolve(res);
    });
  }

  async _fetchToken() {
    try {
      const token = await this.messaging.getToken();
      console.log(`FCM Token ${token}`);
    } catch (err) {
      console.log('An error occurred while retrieving token. ', err);
    }
  }
}

const dbService = new Database();
export default dbService;
