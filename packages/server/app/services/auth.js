const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { objectToJSON } = require('../utils');

class Auth {
  constructor(database) {
    this.saltRounds = 12;
    this.database = database;
  }

  async login({ email, password, clientId }) {
    let user = this.database.findOne('user', email, 'email');
    if (user !== null) {
      try {
        user = objectToJSON(user);
        const match = await bcrypt.compare(password, user.password);
        if (match) {
          const client = this._addClient({
            userId: user._id,
            clientId,
            clientSecret: crypto.randomBytes(20).toString('hex')
          });
          return client;
        }

        return false;
      } catch (err) {
        throw new Error(err);
      }
    } else {
      return false;
    }
  }

  _addClient({ userId, clientId, clientSecret }) {
    let client;
    this.database.write(() => {
      client = this.database.create('client', {
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
