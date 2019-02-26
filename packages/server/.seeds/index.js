const users = require('./users');
const views = require('./views');
const userRoles = require('./user-roles');
const programs = require('./programs');
const tests = require('./tests');

module.exports = (database) => {
  database.write(() => {
    views(database);
    userRoles(database);
    users(database);
    programs(database);
    tests(database);
  });
}
