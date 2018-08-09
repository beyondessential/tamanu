const Promise = require('bluebird');
const PouchDB = require('pouchdb');
const { kebabCase, isNaN, isArray, has, camelCase } = require('lodash');
const shortid = require('shortid');
const { to } = require('await-to-js');
const request = require('request');

const dbHost = 'localhost';
const dbPort = 5984;
const dbUser = 'couchadmin';
const dbPassword = 'test';
const localUrl = `http://${dbUser}:${dbPassword}@${dbHost}:${dbPort}`;
const HTTPPouch = PouchDB.defaults({
  prefix: localUrl
});
const mainDB = new HTTPPouch('main');

console.log('Terminated!');
process.exit();

request('https://api.universalcodes.msupply.org.nz/v1/items', async (error, response, body)  => {
  try {
    const drugs = JSON.parse(body);
    for (i in drugs) {
      const { code, name } = drugs[i];
      const drug = {
        _id: `drug_${shortid.generate()}`,
        docType: 'drug',
        name,
        code
      };

      await mainDB.put(drug);
      console.log('Drug added!');
    }
  } catch (err) {
    console.error('Error: ', err);
  }
});