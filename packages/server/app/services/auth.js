const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { to } = require('await-to-js');
const { isEmpty, isArray } = require('lodash');
const { objectToJSON } = require('../utils');

class Auth {
  constructor(database) {
    this.saltRounds = 12;
    this.database = database;
    this.errors = {
      InvalidCredentials: new Error('Invalid email or password entered.'),
      InvalidHospital: new Error('User not linked to any facility.')
    };
  }

  async login({ email, password: passwordEntered, hospital: hospitalSelected, clientId }) {
    const { _id: userId, password, hospitals } = this._userExists({ email });
    if (!userId)  return Promise.reject(this.errors.InvalidCredentials);

    // Check user's password
    const [err, validPassword] = await to(bcrypt.compare(passwordEntered, password));
    if (err) console.error(err);
    if (!validPassword || err) return Promise.reject(this.errors.InvalidCredentials);

    // Validate hospital
    const checkHospitalResponse = this._checkHospital({ hospitals, hospitalSelected });
    if (checkHospitalResponse === false)  return Promise.reject(this.errors.InvalidHospital);
    if (isArray(checkHospitalResponse)) {
      return {
        action: 'select-hospital',
        options: checkHospitalResponse
      };
    }

    const { _id: hospitalId } = checkHospitalResponse;
    if (!hospitalId) return Promise.reject(this.errors.InvalidHospital);

    // Register the client
    const clientSecret = crypto.randomBytes(20).toString('hex');
    return this._addClient({ hospitalId, userId, clientId, clientSecret });
  }

  _userExists({ email }) {
    let user = this.database.findOne('user', email, 'email');
    if (user && user !== null) {
      try {
        user = objectToJSON(user);
        return user;
      } catch (err) {
        throw err;
      }
    }
    return false;
  }

  _checkHospital({ hospitals, hospitalSelected }) {
    if (isEmpty(hospitals)) throw this.errors.InvalidHospital;
    if (hospitals.length > 1 && !hospitalSelected) {
      return hospitals.map(({ _id, name }) => ({ _id, name }));
    }

    if (hospitalSelected) {
      const hospital = hospitals.find(({ _id }) => (_id === hospitalSelected));
      if (hospital) return hospital;
    }
    return false;
  }

  async checkLogin({ clientId, clientSecret }) {
    return new Promise((resolve, reject) => {
      const user = this.database.find('client', `clientId = "${clientId}" AND clientSecret = "${clientSecret}"`);
      if (user && user.length > 0) {
        return resolve(user[0]);
      }
      return reject(new Error('Invalid credentials.'));
    });
  }

  _addClient({ hospitalId, userId, clientId, clientSecret }) {
    let client;
    this.database.write(() => {
      client = this.database.create('client', {
        hospitalId,
        userId,
        clientId,
        clientSecret,
        date: new Date()
      }, true);
    });
    return client;
  }
}

module.exports = Auth;
