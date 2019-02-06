const config = require('config');
const BaseAuth = require('../../../shared/services/auth');

class Auth extends BaseAuth {
  constructor(props) {
    super(props);
    this.sessionTimeout = config.sessionTimeout
                            ? config.sessionTimeout
                            : (60 * 60 * 24 * 14 * 1000);
  }
}

module.exports = Auth;
