import BaseDatabase from 'Shared/services/database';
import { Settings } from './settings';

export class Database extends BaseDatabase {
  constructor(...props) {
    super(...props);
    this.settings = new Settings(this);
    this.listeners = {};
  }
}
