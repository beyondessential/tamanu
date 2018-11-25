const bcrypt = require('bcrypt');
const AuthService = require('../app/services/auth');

module.exports = (database) => {
  database.create('hospital', {
    _id: 'hospital-demo-1',
    name: 'Demo Hospital'
  }, true);

  const saltRounds = 12;
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync('123455', salt);
  database.create('user', {
    _id: 'demo-user-1',
    displayName: 'John',
    name: 'John Doe',
    email: 'john.doe@gmail.com',
    password: hash,
    secret: 'hospital-demo-1-secret-key'
  }, true);

  database.create('user', {
    _id: 'demo-user-2',
    displayName: 'John1',
    name: 'John Doe1',
    email: 'john.doe1@gmail.com',
    password: hash,
    secret: 'hospital-demo-2-secret-key'
  }, true);
}