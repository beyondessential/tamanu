import Settings from './settings';
import BaseDatabase from 'Shared/services/database';

export default class Database extends BaseDatabase {
  constructor(...props) {
    super(...props);
    this.settings = new Settings(this);
    this.listeners = {};
  }
}
