const users = require('./users');
const views = require('./views');
const userRoles = require('./user-roles');
const programs = require('./programs');
const tests = require('./tests');

module.exports = (database) => {
  const patients = database.objects('patient');
  const createdBy = database.findOne('user', 'demo--admin');
  database.write(() => {
    views(database);
    userRoles(database);
    users(database);
    programs(database);
    tests(database, createdBy);
  });
}