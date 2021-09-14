import config from 'config';
import asyncHandler from 'express-async-handler';

import { log } from 'shared/services/logging';
import { RequestQueueTimeoutError, RequestQueueExceededError } from 'shared/errors';

// helper class which defines a queue of requests and can shed load if the queue
// grows too large
class RequestQueue {
  activeRequestCount = 0;

  // filtering an array is faster than deleting an item from a hash for small
  // numbers of items
  queuedRequests = [];

  constructor({
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
    this.queueTimeout = queueTimeout;
    this.maxActiveRequests = maxActiveRequests;
    this.maxQueuedRequests = maxQueuedRequests;
  }

  // acquire a lock, and block the request until we have one
  //
  // if this function completes successfully, the caller MUST call the returned
  // `release` function, otherwise the queue will be blocked!
  async acquire() {
    log.debug(
      `RequestQueue.acquire(): queued=${this.queuedRequests.length}/${this.maxQueuedRequests} active=${this.activeRequestCount}/${this.maxActiveRequests} timeout=${this.queueTimeout}ms`,
    );

    // reject requests once the request queue is full
    if (this.queuedRequests.length >= this.maxQueuedRequests) {
      throw new RequestQueueExceededError(
        'RequestQueue.acquire(): max queued requests exceeded (system may be under heavy load)',
      );
    }

    // queue requests once active request pool is full
    if (this.activeRequestCount >= this.maxActiveRequests) {
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
            reject(
              new RequestQueueTimeoutError(
                'RequestQueue.acquire(): timed out (system may be under heavy load)',
              ),
            );
          },
        };
        timeoutHandle = setTimeout(request.cancel, this.queueTimeout);
        this.queuedRequests.push(request);
      });
    }

    // acquire lock and return `release` function
    this.activeRequestCount += 1;
    return () => {
      this.activeRequestCount -= 1;
      const request = this.queuedRequests.pop();
      // `request` can be null if nothing is queued
      if (request) {
        request.start();
      }
    };
  }
}

const normalisePath = path => (path.endsWith('/') ? path : `${path}/`);

export const loadshedder = (options = config.loadshedder) => {
  const requestQueues = [];
  for (const queueOptions of options.queues) {
    const requestQueue = new RequestQueue(queueOptions);
    for (const prefix of queueOptions.prefixes) {
      requestQueues.push([prefix, requestQueue]);
    }
  }

  return asyncHandler(async (req, res, next) => {
    const path = normalisePath(req.path);
    // iterate over request queues until we find a matching one
    for (const [prefix, requestQueue] of requestQueues) {
      if (path.startsWith(prefix)) {
        // acquire a lock from the queue and release it when the request is disposed of
        let release = null;
        res.once('finish', () => {
          // `release` can be null if `requestQueue.acquire()` throws an error
          if (release) {
            release();
          }
        });
        release = await requestQueue.acquire();
        break;
      }
    }
    next();
  });
};
