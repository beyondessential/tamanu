const users = require('./users');
const views = require('./views');
const userRoles = require('./user-roles');
const programs = require('./programs');
const tests = require('./tests');
const imagingTypes = require('./imaging-types');
const patients = require('./patients');

module.exports = async (database) => {
  views(database);
  userRoles(database);
  users(database);
  programs(database);
  tests(database);
  await patients(database);
}
