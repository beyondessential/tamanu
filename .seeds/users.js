const bcrypt = require('bcrypt');

module.exports = (database) => {
  database.create('hospital', {
    _id: 'hospital-demo-1',
    name: 'Demo Hospital'
  }, true);

  const saltRounds = 10;
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
}