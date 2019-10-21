import bcrypt from 'bcrypt';

export default database => {
  const saltRounds = 12;
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync('123455', salt);

  database.write(() => {
    const facility = database.create(
      'facility',
      {
        _id: 'demo--facility',
        name: 'Demo Facility',
      },
      true,
    );

    const roles = database.find('role');
    roles.forEach(({ _id, name }) => {
      const user = database.create(
        'user',
        {
          _id: `demo--${_id}`,
          displayName: name,
          name,
          email: `demo-${_id}@xyz.com`,
          password: hash,
        },
        true,
      );

      const userRole = database.create(
        'userRole',
        {
          _id: `${user._id}:${facility._id}:${_id}`,
          facility,
          role: { _id },
        },
        true,
      );

      if (facility.users.indexOf(user) === -1) {
        facility.users.push(user);
      }
      if (user.roles.indexOf(userRole) === -1) {
        user.roles.push(userRole);
      }
    });
  });
};
