import config from 'config';
import asyncHandler from 'express-async-handler';

import { log } from '@tamanu/shared/services/logging';
import { RateLimitedError } from '@tamanu/errors';

// helper class which defines a queue of requests and can shed load if the queue
// grows too large
export class RequestQueue {
  activeRequestCount = 0;

  // filtering an array is faster than deleting an item from a hash for small
  // numbers of items
  queuedRequests = [];

  constructor({
    // friendly name for the queue to make logging output more readable
    name,

    // maximum concurrent requests active at the one time
    maxActiveRequests,

    // maximum number of requests waiting to become active
    maxQueuedRequests,

    // maximum time a request can spend queued without becoming active
    //
    // this will only matter if requests are starting to back up, it's NOT the
    // same as total request timeout
    queueTimeout,
  }) {
    this.queueName = name;
    this.queueTimeout = queueTimeout;
    this.maxActiveRequests = maxActiveRequests;
    this.maxQueuedRequests = maxQueuedRequests;
  }

  // acquire a lock, and block the request until we have one
  //
  // if this function completes successfully, the caller MUST call the returned
  // `release` function, otherwise the queue will be blocked!
  async acquire() {
    const logEvent = eventName => {
      log.debug(`RequestQueue.acquire(): ${eventName}`, {
        queue: this.queueName,
        queued: `${this.queuedRequests.length}/${this.maxQueuedRequests}`,
        active: `${this.activeRequestCount}/${this.maxActiveRequests}`,
        timeout: `${this.queueTimeout}ms`,
      });
    };

    // attempt to queue requests once active request pool is full
    if (this.activeRequestCount >= this.maxActiveRequests) {
      // reject requests once the request queue is full
      if (this.queuedRequests.length >= this.maxQueuedRequests) {
        logEvent('rejected (queue exceeded)');
        throw new RateLimitedError(
          Math.floor(this.queueTimeout / 1000),
          'RequestQueue.acquire(): max queued requests exceeded (system may be under heavy load)',
        );
      }

      // otherwise, block until an active request completes
      await new Promise((resolve, reject) => {
        let timeoutHandle = null;
        const request = {
          // cancel the timeout and resolve this promise, letting the caller continue
          start: () => {
            clearTimeout(timeoutHandle);
            resolve();
          },
          // cancel the timeout and reject this promise, throwing an error and stopping the caller
          // also has to dequeue the request to stop it being started
          cancel: () => {
            clearTimeout(timeoutHandle);
            this.queuedRequests = this.queuedRequests.filter(j => j === request);
            logEvent('rejected (timeout)');
            reject(
              new RateLimitedError(
                Math.floor(this.queueTimeout / 1000),
                'RequestQueue.acquire(): timed out (system may be under heavy load)',
              ),
            );
          },
        };
        timeoutHandle = setTimeout(request.cancel, this.queueTimeout);
        this.queuedRequests.push(request);
        logEvent('queued');
      });
    }

    // acquire lock and return `release` function
    this.activeRequestCount += 1;
    logEvent('activated');
    return () => {
      this.activeRequestCount -= 1;
      const request = this.queuedRequests.pop();
      // `request` can be null if nothing is queued
      if (request) {
        request.start();
      }
      logEvent('released');
    };
  }
}

const normalisePath = path => (path.endsWith('/') ? path : `${path}/`);

export class QueueManager {
  prefixQueueTuples = [];

  constructor(queueDefinitions) {
    for (const queueDefinition of queueDefinitions) {
      const queue = new RequestQueue(queueDefinition);
      for (const prefix of queueDefinition.prefixes) {
        this.prefixQueueTuples.push([normalisePath(prefix), queue]);
      }
    }
  }

  getQueue(path) {
    const normalisedPath = normalisePath(path);
    // iterate over request queues until we find a matching one
    for (const [prefix, queue] of this.prefixQueueTuples) {
      if (normalisedPath.startsWith(prefix)) {
        return queue;
      }
    }
    return null; // no queue found
  }
}

export const loadshedder = (options = config.loadshedder) => {
  const manager = new QueueManager(options.queues);

  return asyncHandler(async (req, res, next) => {
    const queue = manager.getQueue(req.path);
    if (queue) {
      // acquire a lock from the queue and release it when the request is disposed of
      const release = await queue.acquire();
      res.once('close', () => {
        release();
      });
    }
    next();
  });
};
