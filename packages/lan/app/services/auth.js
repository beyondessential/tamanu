const config = require('config');
const prompts = require('prompts');
const request = require('request-promise');
const { to } = require('await-to-js');
const { isArray, join } = require('lodash');

class Auth {
  constructor(database) {
    this.database = database;
    this.credentials = {};
    this.hospitalOptions = [];
    this.schema = [{
        type: 'text',
        message: 'Enter email',
        name: 'email',
        required: true,
        validate: email => /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i.test(email),
      }, {
        type: 'password',
        message: 'Enter password',
        name: 'password',
        hidden: true,
        required: true,
        validate: password => password.length
      }
    ];
    this.schemaHospital = [{
        type: 'select',
        message: 'Select hospital',
        name: 'hospital',
        required: true,
        choices: () => this.hospitalOptions
      }
    ];
  }

  async promptLogin(cb, verifyCredentials = true, schema = this.schema) {
    const clientId = this.database.getSetting('CLIENT_ID');
    const clientSecret = this.database.getSetting('CLIENT_SECRET');
    const hospitalId = this.database.getSetting('HOSPITAL_ID');
    let promptUser = true;

    if (clientId && clientSecret && hospitalId && verifyCredentials) {
      const [, valid] = await to(this._verifyCredentials({ clientId, clientSecret }));
      if (valid.clientId && valid.clientSecret) return cb();
    }

    const answers = await prompts(schema, {
      onSubmit: (prompt, answer) => {
        this.credentials[prompt.name] = answer;
      },
      onCancel: (prompt, answers) => {
        if (!answers.email || !answers.password) {
          console.log('Aborted.');
          process.exit();
        }
      }
    });

    if (this.credentials.email && this.credentials.password) {
      const [err, res] = await to(this._login());
      if (!err) {
        if (res.action === 'select-hospital') {
          this.hospitalOptions = res.options.map(({ _id: value, name: title }) => ({ title, value }));
          this.promptLogin(cb, false, this.schemaHospital);
        } else {
          // Save user auth secret
          this.database.setSetting('CLIENT_SECRET', res.clientSecret);
          this.database.setSetting('HOSPITAL_ID', res.hospitalId);
          cb();
        }
      } else {
        console.error(err.error);
        this.promptLogin(cb, false);
      }
    }
  }

  _login() {
    return new Promise(async (resolve, reject) => {
      const clientId = this.database.getSetting('CLIENT_ID');
      const [err, res] = await to(request({
        method: 'POST',
        url: `${config.mainServer}/auth/login`,
        json: { clientId, ...this.credentials }
      }));

      if (err) return reject(err);
      resolve(res);
    });
  }

  _verifyCredentials({ clientId, clientSecret }) {
    return new Promise(async (resolve, reject) => {
      const [err, res] = await to(request({
        method: 'POST',
        url: `${config.mainServer}/auth/verify-credentials`,
        json: { clientId, clientSecret }
      }));

      if (err) return reject(err);
      resolve(res);
    });
  }
}

module.exports = Auth;
