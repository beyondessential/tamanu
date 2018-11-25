const Promise = require('bluebird');
const PouchDB = require('pouchdb');
const { toUpper } = require('lodash');
const shortid = require('shortid');
const { to } = require('await-to-js');
const request = require('request');
const Realm = require('realm');
const DrugSchema = require('../tamanu-common/schemas/drug');
const ChangeSchema = require('../tamanu-common/schemas/change');

const database = new Realm({
  path: '../data/main.realm',
  schema: [DrugSchema, ChangeSchema],
  schemaVersion: 2,
});

console.log('Terminated!');
process.exit();

request('https://api.universalcodes.msupply.org.nz/v1/items', async (error, response, body)  => {
  try {
    const drugs = JSON.parse(body);
    database.write(() => {
      drugs.forEach((drug) => {
        const { code, name } = drug;
        const object = {
          _id: shortid.generate(),
          name,
          code: toUpper(code)
        };

        const change = {
          _id: shortid.generate(),
          action: 'SAVE',
          recordId: object._id,
          recordType: 'drug',
          timestamp: new Date().getTime()
        };

        database.create('drug', object, true);
        database.create('change', change, true);
        console.log('Drug added!');
      });
    });
  } catch (err) {
    console.error('Error: ', err);
  }
});