const Promise = require('bluebird');
const PouchDB = require('pouchdb');
const { random } = require('lodash');
const shortid = require('shortid');
const { to } = require('await-to-js');
const request = require('request');
const Realm = require('realm');
const models = require('../../tamanu-lan-server/app/models');

const database = new Realm({
  path: '../../tamanu-lan-server/data/main.realm',
  schema: models,
  schemaVersion: 2,
});

const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

console.log('Terminated!');
process.exit();
try {
  database.write(() => {
    for (let i = 0; i <= 30; i += 1) {
      const patient = [
        {
          _id: shortid.generate(),
          displayId: `P000013${i}`,
          firstName: `John${i}`,
          lastName: `Doe${i}`,
          sex: 'male',
          dateOfBirth: randomDate(new Date(1980, 0, 1), new Date(1990, 0, 1))
        },
        {
          _id: shortid.generate(),
          displayId: `P000013${i}`,
          firstName: `Jane${i}`,
          lastName: `Doe${i}`,
          sex: 'female',
          dateOfBirth: randomDate(new Date(1980, 0, 1), new Date(1990, 0, 1))
        }
      ];

      const result = database.create('patient', patient[random(0, 1)], true);
      console.log('-result-', result);
    }
  });
} catch (err) {
  console.error(err);
}

