export class Migration {
  store = null;

  log = null;

  static defaultBatchSize = 10000;

  static defaultDelayMs = 0;

  constructor(store, log) {
    if (this.constructor === Migration) {
      throw new Error('Migration is abstract');
    }
    this.store = store;
    this.log = log;
  }

  // eslint-disable-next-line no-unused-vars
  async doBatch(limit) {
    throw new Error('you should extend doBatch');
  }

  isComplete() {
    throw new Error('you should extend isComplete');
  }
}
