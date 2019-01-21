const users = require('./users');
const views = require('./views');
const userRoles = require('./user-roles');

module.exports = (database) => {
  const patients = database.objects('patient');
  database.write(() => {
    views(database);
    userRoles(database);
    users(database);
  });
}