const users = require('./users');
const views = require('./views');

module.exports = (database) => {
  database.write(() => {
    users(database);
    views(database);
  });
}