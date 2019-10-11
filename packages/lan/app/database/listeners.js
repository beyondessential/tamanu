import BaseListeners from 'Shared/services/listeners';
import { QueueManager } from './queue-manager';
import { Sync } from './sync';

export class Listeners extends BaseListeners {
  constructor(database) {
    super(database);
    this.sync = new Sync(database, this);
    this.queueManager = new QueueManager(database);
  }
}
