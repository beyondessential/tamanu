const config = require('../../config');
const prompt = require('prompt');
const request = require('request');
const { isArray, join } = require('lodash');

class Auth {
  constructor(database) {
    this.database = database;
    this.schema = {
      properties: {
        email: {
          pattern: /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i,
          message: 'Invalid email address added',
          description: 'Enter email',
          required: true
        },
        password: {
          description: 'Enter password',
          hidden: true,
          required: true
        }
      }
    };
  }

  promptLogin(cb) {
    const clientId = this.database.getSetting('CLIENT_ID');
    const clientSecret = this.database.getSetting('CLIENT_SECRET');
    if (!clientId || !clientSecret) {
      prompt.start();
      prompt.get(this.schema, (err, result) => {
        if (err) throw new Error(err);
        this._login(result, cb);
      });
    } else {
      cb();
    }
  }

  _login(result, cb) {
    const clientId = this.database.getSetting('CLIENT_ID');
    request({
      method: 'POST',
      url: `${config.mainServer}/auth/login`,
      json: { clientId, ...result }
    }, (error, response, body) => {
      if (!error && !body.error) {
        // Save user auth secret
        this.database.setSetting('CLIENT_SECRET', body.clientSecret);
        cb();
      } else {
        console.error(error || (isArray(body.error) ? join(body.error) : body.error));
        // Reset prompt
        this.promptLogin(cb);
      }
    });
  }
}

module.exports = Auth;


//  john.doe@gmail.com
//  123455
