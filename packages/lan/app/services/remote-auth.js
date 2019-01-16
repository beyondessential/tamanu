const config = require('config');
const prompts = require('prompts');
const request = require('request-promise');
const { to } = require('await-to-js');

class RemoteAuth {
  constructor(database) {
    this.mainServer = config.mainServer;
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

    if (clientId && clientSecret && hospitalId && verifyCredentials) {
      const [err, valid] = await to(this._verifyCredentials({ clientId, clientSecret, hospitalId }));
      if (!err && valid && valid.clientId && valid.clientSecret) return cb();
    }

    const answers = await prompts(schema, {
      onSubmit: (prompt, answer) => {
        this.credentials[prompt.name] = answer;
      },
      onCancel: () => {
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

  async _login() {
    const clientId = this.database.getSetting('CLIENT_ID');
    const hospitalId = this.database.getSetting('HOSPITAL_ID');
    let firstTimeLogin = false;
    if (!hospitalId) firstTimeLogin = true;

    const [err, res] = await to(request({
      method: 'POST',
      url: `${this.mainServer}/auth/login`,
      json: { ...this.credentials, clientId, hospitalId, firstTimeLogin }
    }));

    if (err) return Promise.reject(err);
    return res;
  }

  async _verifyCredentials({ clientId, clientSecret, hospitalId }) {
    const [err, res] = await to(request({
      method: 'POST',
      url: `${this.mainServer}/auth/verify-credentials`,
      json: { clientId, clientSecret, hospitalId }
    }));

    if (err) return Promise.reject(err);
    return res;
  }
}

module.exports = RemoteAuth;
