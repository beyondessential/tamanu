/**
 * Maintains the internal queue of changes to be synced: queues changes, provides them when asked,
 * and removes them when marked as used. First changed first out, i.e. the oldest changes are synced
 * first.
 */
const EventEmitter = require('events');
const { each } = require('lodash');

class QueueManager extends EventEmitter {
  constructor(database) {
    super();
    this.database = database;
    this.schemaName = 'change';
    this.queue = {};
    this.timeout = 1000;
    this.timer = null;
  }

  /**
   * Enqueue a change. Must be called from within a database.write transaction
   * @param  {string} action     The action that caused the change i-e SAVE or REMOVE
   * @param  {string} recordId   Id of the record that was changed
   * @param  {string} recordType   Type of the record that was change
   * @return {none}
   */
  push({ action, recordId, recordType }) {
    console.log('-push-', { action, recordId, recordType });
    if (!recordId) throw new Error('Cannot push a change without a record id onto the change queue');
    const key = `${recordType}-${recordId}`;
    this.queue[key] = {
      _id: key,
      timestamp: new Date().getTime(),
      action,
      recordId,
      recordType
    };

    // Wait for concurrent push
    // Don't wait for next push if there's more than 10 items in queue
    clearTimeout(this.timer);
    if (this.queue.length > 10) {
      this.saveToDatabase();
    } else {
      this.timer = setTimeout(() => this.saveToDatabase(), this.timeout);
    }
  }

  saveToDatabase() {
    if (!this.isInTransaction) {
      console.log('saveToDatabase');
      this.database.write(() => {
        each(this.queue, (item, key) => {
          this.database.create(this.schemaName, item, true);
          delete this.queue[key];
        });
      });
      super.emit('change');
    } else {
      // Delay the operation
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.saveToDatabase(), this.timeout);
    }
  }

  /**
   * Return the number of records in the change queue.
   * @return {integer} Number of changes awaiting sync
   */
  get length() {
    return this.objects(this.schemaName).length;
  }

  /**
   * Return the next x changes to be synced.
   * @param  {integer}   numberOfRecords The number of changes to return (defaults to 1)
   * @return {array}                     An array of the top x changes in the queue
   */
  next(numberOfChanges) {
    const numberToReturn = numberOfChanges || 1;
    const allChanges = this.objects(this.schemaName).sorted('timestamp');
    return allChanges.slice(0, numberToReturn);
  }

  /**
   * Remove the given changes from the sync queue.
   * @param  {array} changes An array of the changes that have been used
   * @return {none}
   */
  use(changes) {
    this.database.write(() => {
      this.database.delete(this.schemaName, changes);
    });
  }
}

module.exports = QueueManager;
