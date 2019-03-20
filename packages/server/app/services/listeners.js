import BaseListeners from 'Shared/services/listeners';
import QueueManager from './queue-manager';
import Sync from './sync';

export default class Listeners extends BaseListeners {
  constructor(database, bayeux) {
    super(database);
    this.queueManager = new QueueManager(database);
    this.sync = new Sync(database, bayeux, this.queueManager);

    // Setup sync
    this.sync.disconnectClients();
    this.sync.setup();
    this.queueManager.on('change', () => this.sync.synchronize());
  }
}
