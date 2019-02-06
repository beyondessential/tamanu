const bcrypt = require('bcrypt');
const AuthService = require('../app/services/auth');

module.exports = (database) => {
  const saltRounds = 12;
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync('123455', salt);

  const userA = database.create('user', {
    _id: 'demo-user-11',
    displayName: 'John',
    name: 'John Doe',
    email: 'john.doe@gmail.com',
    password: hash,
    secret: 'hospital-demo-1-secret-key'
  }, true);

  const userB = database.create('user', {
    _id: 'demo-user-22',
    displayName: 'John1',
    name: 'John Doe1',
    email: 'john.doe1@gmail.com',
    password: hash,
    secret: 'hospital-demo-2-secret-key'
  }, true);

  const hospitalA = database.create('hospital', {
    _id: 'hospital-demo-9',
    name: 'Demo Hospital A'
  }, true);

  const hospitalB = database.create('hospital', {
    _id: 'hospital-demo-10',
    name: 'Demo Hospital B'
  }, true);

  const seniorDoctorRole = database.findOne('role', 'senior-doctor');
  const adminRole = database.findOne('role', 'admin');
  const juniorNurseRole = database.findOne('role', 'junior-nurse');

  const userARole1 = database.create('userRole', {
    _id: `${userA._id}:${hospitalA._id}:${seniorDoctorRole._id}`,
    hospital: hospitalA,
    role: seniorDoctorRole
  }, true);

  const userARole2 = database.create('userRole', {
    _id: `${userA._id}:${hospitalB._id}:${adminRole._id}`,
    hospital: hospitalB,
    role: adminRole
  }, true);

  const userBRole1 = database.create('userRole', {
    _id: `${userB._id}:${hospitalA._id}:${juniorNurseRole._id}`,
    hospital: hospitalA,
    role: juniorNurseRole
  }, true);

  // User A
  if (hospitalA.users.indexOf(userA) === -1) hospitalA.users.push(userA);
  if (hospitalB.users.indexOf(userA) === -1) hospitalB.users.push(userA);
  if (userA.roles.indexOf(userARole1) === -1) userA.roles.push(userARole1);
  if (userA.roles.indexOf(userARole2) === -1) userA.roles.push(userARole2);

  // User B
  if (hospitalA.users.indexOf(userB) === -1) hospitalA.users.push(userB);
  if (userB.roles.indexOf(userBRole1) === -1) userB.roles.push(userBRole1);
}