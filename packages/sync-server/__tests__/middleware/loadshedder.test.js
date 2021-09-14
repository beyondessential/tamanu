import { RequestQueueTimeoutError, RequestQueueExceededError } from 'shared/errors';

import { RequestQueue } from 'sync-server/app/middleware/loadshedder';

describe('RequestQueue', () => {
  it('allows multiple parallel requests through under the threshold', async () => {
    const queue = new RequestQueue({
      maxActiveRequests: 2,
      maxQueuedRequests: 0,
      queueTimeout: 1000,
    });
    const release1 = await queue.acquire();
    const release2 = await queue.acquire();

    expect(queue.activeRequestCount).toEqual(2);
    expect(queue.queuedRequests.length).toEqual(0);

    release1();
    const release3 = await queue.acquire();
    expect(queue.activeRequestCount).toEqual(2);
    expect(queue.queuedRequests.length).toEqual(0);

    release2();
    expect(queue.activeRequestCount).toEqual(1);
    expect(queue.queuedRequests.length).toEqual(0);

    release3();
    expect(queue.activeRequestCount).toEqual(0);
    expect(queue.queuedRequests.length).toEqual(0);
  });

  it('queues parallel requests over the threshold', async () => {
    const queue = new RequestQueue({
      maxActiveRequests: 2,
      maxQueuedRequests: 2,
      queueTimeout: 1000,
    });

    const release1 = await queue.acquire();
    const release2 = await queue.acquire();
    const release3Promise = queue.acquire();
    const release4Promise = queue.acquire();

    expect(queue.activeRequestCount).toEqual(2);
    expect(queue.queuedRequests.length).toEqual(2);

    release1();
    release2();
    const [release3, release4] = await Promise.all([release3Promise, release4Promise]);
    expect(queue.activeRequestCount).toEqual(2);
    expect(queue.queuedRequests.length).toEqual(0);

    release3();
    release4();
    expect(queue.activeRequestCount).toEqual(0);
    expect(queue.queuedRequests.length).toEqual(0);
  });

  it('rejects parallel requests once the queue is full', async () => {
    const queue = new RequestQueue({
      maxActiveRequests: 1,
      maxQueuedRequests: 1,
      queueTimeout: 1000,
    });
    await expect(queue.acquire()).resolves.toEqual(expect.anything());
    expect(queue.acquire()).toEqual(expect.any(Promise));
    await expect(queue.acquire()).rejects.toEqual(expect.any(RequestQueueExceededError));
  });

  it('rejects parallel requests that take too long', async () => {
    const queue = new RequestQueue({
      maxActiveRequests: 1,
      maxQueuedRequests: 1,
      queueTimeout: 100,
    });
    await expect(queue.acquire()).resolves.toEqual(expect.anything());
    const startMs = Date.now();
    await expect(queue.acquire()).rejects.toEqual(expect.any(RequestQueueTimeoutError));
    const elapsedMs = Date.now() - startMs;
    expect(elapsedMs).toBeLessThan(150);
  });
});
