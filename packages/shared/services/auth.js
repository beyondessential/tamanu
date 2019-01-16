const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { to } = require('await-to-js');
const { isEmpty, isArray, head, isNumber } = require('lodash');
const { objectToJSON } = require('../utils');

class BaseAuth {
  constructor(database) {
    this.saltRounds = 12;
    this.database = database;
    this.errors = {
      InvalidCredentials: 'Invalid email or password entered.',
      InvalidHospital: 'User not linked to aany facility.',
      invalidToken: 'Invalid credentials.'
    };
  }

  async login({
    email,
    password: passwordEntered,
    hospital: hospitalSelected,
    clientId,
    firstTimeLogin = false
  }) {
    if (!isNumber(this.sessionTimeout)) throw new Error('Invalid session timeout.');
    const expiry = new Date().getTime() + this.sessionTimeout;

    const { _id: userId, password, hospitals } = this._userExists({ email });
    if (!userId)  return Promise.reject(new Error(this.errors.InvalidCredentials));

    // Check user's password
    const [err, validPassword] = await to(bcrypt.compare(passwordEntered, password));
    if (err) console.error(err);
    if (!validPassword || err) return Promise.reject(new Error(this.errors.InvalidCredentials));

    // Validate hospital
    const checkHospitalResponse = this._checkHospital({ hospitals, hospitalSelected, firstTimeLogin });
    if (checkHospitalResponse === false)  return Promise.reject(new Error(this.errors.InvalidHospital));
    if (isArray(checkHospitalResponse)) {
      return {
        action: 'select-hospital',
        options: checkHospitalResponse
      };
    }

    const { _id: hospitalId } = checkHospitalResponse;
    if (!hospitalId) return Promise.reject(new Error(this.errors.InvalidHospital));

    // Register the client
    const clientSecret = crypto.randomBytes(20).toString('hex');
    return this._addClient({ hospitalId, userId, clientId, clientSecret, expiry });
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

  _checkHospital({ hospitals, hospitalSelected, firstTimeLogin }) {
    if (isEmpty(hospitals)) throw this.errors.InvalidHospital;
    if (hospitals.length > 1 && !hospitalSelected) {
      return hospitals.map(({ _id, name }) => ({ _id, name }));
    }

    if (hospitalSelected) {
      const hospital = hospitals.find(({ _id }) => (_id === hospitalSelected));
      if (hospital) return hospital;
    }

    if (firstTimeLogin && hospitals.length > 0) return head(hospitals);
    return false;
  }

  _addClient({ hospitalId, userId, clientId, clientSecret, expiry }) {
    let client;
    this.database.write(() => {
      client = this.database.create('client', {
        hospitalId,
        userId,
        clientId,
        clientSecret,
        expiry,
        date: new Date()
      }, true);
    });
    return client;
  }

  async verifyExtendToken({ clientId, clientSecret, extend=true }) {
    try {
      const user = this.database.find(
        'client',
        `clientId = "${clientId}" AND clientSecret = "${clientSecret}" AND expiry > "${new Date().getTime()}" `
      );
      if (user && user.length > 0) {
        if (extend === true && isNumber(this.sessionTimeout)) {
          this.database.write(() => user.sessionTimeout = new Date().getTime() + this.sessionTimeout);
        }
        return head(user);
      }
      return Promise.reject(new Error(this.errors.invalidToken));
    } catch (err) {
      return Promise.reject(err);
    }
  }
}

module.exports = BaseAuth;
