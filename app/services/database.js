const Realm = require('realm');
const models = require('../models');
// const { to } = require('await-to-js');
// const createIndex = require('../utils/createIndex');
// const createViews = require('../utils/createViews');

const internals = {};
internals.connect = async () => {
  const realm = await Realm.open({
    path: './data/main.realm',
    schema: models,
    schemaVersion: 2,
  });

  console.log('Database connected!');
  return realm;
};

module.exports = internals;
