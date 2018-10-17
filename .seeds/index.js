const users = require('./users');

module.exports = (database) => {
  database.write(() => {
    users(database);
  });
}