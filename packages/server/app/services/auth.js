const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { isEmpty } = require('lodash');
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

  login({ email, password, hospital: hospitalSelected, clientId }) {
    return new Promise(async (resolve, reject) => {
      let user = this.database.findOne('user', email, 'email');
      if (user && user !== null) {
        try {
          user = objectToJSON(user);
          const match = await bcrypt.compare(password, user.password);
          if (match) {
            const { hospitals } = user;
            if (!isEmpty(hospitals)) {
              let hospitalId = hospitals[0]._id;
              if (hospitals.length > 1) {
                if (!hospitalSelected) {
                  return resolve({
                    action: 'select-hospital',
                    options: hospitals.map(({ _id, name }) => ({ _id, name }))
                  });
                }

                hospitals.forEach((hospital) => {
                  if (hospital._id === hospitalSelected) hospitalId = hospitalSelected;
                });
              }
              if (!hospitalId) return reject(this.errors.InvalidHospital);

              // Register the client
              const client = this._addClient({
                hospitalId,
                userId: user._id,
                clientId,
                clientSecret: crypto.randomBytes(20).toString('hex')
              });
              return resolve(client);
            }

            return reject(this.errors.InvalidHospital);
          }

          return reject(this.errors.InvalidCredentials);
        } catch (err) {
          return reject(this.errors.InvalidCredentials);
        }
      } else {
        return reject(this.errors.InvalidCredentials);
      }
    });
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
