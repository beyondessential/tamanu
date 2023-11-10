/*
 * Data migrations are long-running one-way data transformations that move a lot
 * of data around and need to support extra features, primarily batching.
 *
 * DataMigration is the abstract representation of this need. It uses the
 * `doBatch` and `isComplete` methods to run limited size batches, with both
 * delay and batch size being configurable.
 *
 * It's generally better to inherit from DataMigration and add more
 * functionality in the subclass, rather than in the DataMigration class itself.
 * The exception is adding new behaviour to _every_ data migration: if you do
 * that you should also change every subclass.
 *
 * Raw SQL migrations that can use cursors should use CursorDataMigration.
 */
export class DataMigration {
  store = null;

  log = null;

  // You can override this if a smaller or larger default makes more sense
  static defaultBatchSize = 10000;

  /*
   * You can override this if the child data migration usually needs a delay
   * between batches
   */
  static defaultDelayMs = 0;

  constructor(store, log) {
    if (this.constructor === DataMigration) {
      throw new Error('DataMigration is abstract');
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
