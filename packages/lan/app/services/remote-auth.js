import config from 'config';
import prompts from 'prompts';
import request from 'request-promise';
import { to } from 'await-to-js';

export default class RemoteAuth {
  constructor(database) {
    this.mainServer = config.mainServer;
    this.database = database;
    this.credentials = {};
    this.facilityOptions = [];
    this.schema = [
      {
        type: 'text',
        message: 'Enter email',
        name: 'email',
        required: true,
        validate: email =>
          /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i.test(
            email,
          ),
      },
      {
        type: 'password',
        message: 'Enter password',
        name: 'password',
        hidden: true,
        required: true,
        validate: password => password.length,
      },
    ];
    this.schemaFacility = [
      {
        type: 'select',
        message: 'Select facility',
        name: 'facility',
        required: true,
        choices: () => this.facilityOptions,
      },
    ];
  }

  async promptLogin(cb, verifyCredentials = true, schema = this.schema) {
    const clientId = this.database.getSetting('CLIENT_ID');
    const clientSecret = this.database.getSetting('CLIENT_SECRET');
    const facilityId = this.database.getSetting('FACILITY_ID');

    if (clientId && clientSecret && facilityId && verifyCredentials) {
      const [err, valid] = await to(
        this._verifyCredentials({ clientId, clientSecret, facilityId }),
      );
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
      },
    });

    if (this.credentials.email && this.credentials.password) {
      const [err, res] = await to(this._login());
      if (!err) {
        if (res.action === 'select-facility') {
          this.facilityOptions = res.options.map(({ _id: value, name: title }) => ({
            title,
            value,
          }));
          this.promptLogin(cb, false, this.schemaFacility);
        } else {
          // Save user auth secret
          this.database.setSetting('CLIENT_SECRET', res.clientSecret);
          this.database.setSetting('FACILITY_ID', res.facilityId);
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
    const facilityId = this.database.getSetting('FACILITY_ID');
    let firstTimeLogin = false;
    if (!facilityId) firstTimeLogin = true;

    const [err, res] = await to(
      request({
        method: 'POST',
        url: `${this.mainServer}/auth/login`,
        json: {
          ...this.credentials,
          clientId,
          facility: facilityId,
          firstTimeLogin,
        },
      }),
    );

    if (err) return Promise.reject(err);
    return res;
  }

  async _verifyCredentials({ clientId, clientSecret, facilityId }) {
    const [err, res] = await to(
      request({
        method: 'POST',
        url: `${this.mainServer}/auth/verify-credentials`,
        json: { clientId, clientSecret, facilityId },
      }),
    );

    if (err) return Promise.reject(err);
    return res;
  }
}
