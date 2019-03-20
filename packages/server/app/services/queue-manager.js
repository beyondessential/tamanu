import BaseQueueManager from 'Shared/services/queue-manager';

export default class QueueManager extends BaseQueueManager {
  constructor(database) {
    super(database);
    this.timeout = 1000;
    this.timer = null;
  }
}
