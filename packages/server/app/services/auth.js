import config from 'config';
import SharedAuth from 'Shared/services/auth';

export default class Auth extends SharedAuth {
  constructor(props) {
    super(props);
    this.sessionTimeout = config.sessionTimeout ? config.sessionTimeout : 60 * 60 * 24 * 14 * 1000;
  }
}
