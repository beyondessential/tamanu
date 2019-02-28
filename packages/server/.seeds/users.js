const bcrypt = require('bcrypt');

module.exports = (database) => {
  const saltRounds = 12;
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync('123455', salt);

  const hospital = database.create('hospital', {
    _id: 'demo--hospital',
    name: 'Demo Hospital'
  }, true);

  const roles = database.find('role');
  roles.forEach(({ _id, name }) => {
    const user = database.create('user', {
      _id: `demo--${_id}`,
      displayName: name,
      name,
      email: `demo-${_id}@xyz.com`,
      password: hash,
      secret: `${_id}-secret-key`
    }, true);

    const userRole = database.create('userRole', {
      _id: `${user._id}:${hospital._id}:${_id}`,
      hospital,
      role: { _id }
    }, true);

    if (hospital.users.indexOf(user) === -1) {
      hospital.users.push(user);
    }
    if (user.roles.indexOf(userRole) === -1) {
      user.roles.push(userRole);
    }
  });
}
