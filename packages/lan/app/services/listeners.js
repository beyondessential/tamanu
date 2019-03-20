import QueueManager from './queue-manager';
import Sync from './sync';
import BaseListeners from 'Shared/services/listeners';

export default class Listeners extends BaseListeners {
  constructor(database) {
    super(database);
    this.sync = new Sync(database, this);
    this.queueManager = new QueueManager(database);
  }
}
