const config = require('config');
const BaseAuth = require('../../../shared/services/auth');
const database = require('./database');

class Auth extends BaseAuth {
  constructor(props) {
    super(props);
    this.database = database;
    this.sessionTimeout = config.sessionTimeout
                            ? config.sessionTimeout
                            : (60 * 60 * 5 * 1000);
  }

  async login (props) {
    const hospitalId = this.database.getSetting('HOSPITAL_ID');
    const newProps = {
      ...props,
      firstTimeLogin: false,
      hospital: hospitalId,
    };
    return super.login(newProps);
  }
}

module.exports = Auth;
