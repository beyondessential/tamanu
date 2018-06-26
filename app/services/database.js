import PouchDB from 'pouchdb';
import { defaults } from 'lodash';
import { ipcRenderer } from 'electron';
import {
  START_NOTIFICATION_SERVICE,
  NOTIFICATION_SERVICE_STARTED,
  NOTIFICATION_SERVICE_ERROR,
  NOTIFICATION_RECEIVED as ON_NOTIFICATION_RECEIVED,
  TOKEN_UPDATED,
} from 'electron-push-receiver/src/constants';
import createViews from '../utils/create-views';
import createIndex from '../utils/create-index';
import backboneSync from '../utils/backbone-sync';
import firebase from '../services/firebase';
// Attach pocuhdb find plugin
PouchDB.plugin(require('pouchdb-find'));

class Database {
  constructor() {
    console.log('Database - constructor');
    this.senderId = '889083073051';
    this.dbHost = 'localhost';
    this.dbPort = 5984;
    this.dbUser = 'couchadmin';
    this.dbPassword = 'test';
    this.messaging = firebase.messaging();
    // this.messaging.usePublicVapidKey('BDWzelnx830a2-S3ZqbUAeBHjM3AY05zVIZyWYMmgEO7vRt5MjoSbpyZsMl3zKVoKuo53i9GhThi_5f82IEUd64');
  }

  createDB() {
    this.configDB = new PouchDB(`http://${this.dbUser}:${this.dbPassword}@${this.dbHost}:${this.dbPort}/config`);
    this.mainDB = new PouchDB(`http://${this.dbUser}:${this.dbPassword}@${this.dbHost}:${this.dbPort}/main`);
  }

  setup() {
    // Generate index & views
    createIndex(this.mainDB);
    createViews(this.mainDB);

    // Setup backbone sync
    this.setupSync();

    // Setup subscriptions
    // this.setupSubscription();
  }

  setupSync() {
    backboneSync(this.mainDB);
  }

  setupSubscription() {
    console.log('setupSubscription');
    // this.messaging.requestPermission().then(() => {
    //   console.log('Notification permission granted.');
    //   // this._fetchToken();
    // }).catch((err) => {
    //   console.log('Unable to get permission to notify.', err);
    // });

    // Listen for service successfully started
    ipcRenderer.on(NOTIFICATION_SERVICE_STARTED, (_, token) => console.log('NOTIFICATION_SERVICE_STARTED', token));
    // Handle notification errors
    ipcRenderer.on(NOTIFICATION_SERVICE_ERROR, (_, error) => console.log('NOTIFICATION_SERVICE_ERROR', error));
    // Send FCM token to backend
    ipcRenderer.on(TOKEN_UPDATED, (_, token) => console.log('TOKEN_UPDATED', token));
    // Display notification
    ipcRenderer.on(ON_NOTIFICATION_RECEIVED, (_, notification) => console.log('ON_NOTIFICATION_RECEIVED', notification));
    // Start service
    ipcRenderer.send(START_NOTIFICATION_SERVICE, this.senderId);
  }

  async _fetchToken() {
    try {
      const token = await this.messaging.getToken();
      console.log(`FCM Token ${token}`);
    } catch (err) {
      console.log('An error occurred while retrieving token. ', err);
    }
  }

  // get mainDB() {
  //   return this.mainDB;
  // }

  // get configDB() {
  //   return this.configDB;
  // }
}

const dbService = new Database();
export default dbService;
