import { RequestQueueTimeoutError, RequestQueueExceededError } from '@tamanu/shared/errors';

import { RequestQueue, QueueManager } from 'sync-server/app/middleware/loadshedder';

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
      queueTimeout: 100,
    });
    await expect(queue.acquire()).resolves.toEqual(expect.anything());
    const willTimeout = queue.acquire();
    expect(willTimeout).toEqual(expect.any(Promise));
    await expect(queue.acquire()).rejects.toEqual(expect.any(RequestQueueExceededError));
    await expect(willTimeout).rejects.toEqual(expect.any(RequestQueueTimeoutError));
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
    expect(elapsedMs).toBeLessThan(1100); // accept any delay less than a second - the event queue can be slow
  });
});

describe('QueueManager', () => {
  {
    const manager = new QueueManager([
      {
        name: 'a',
        prefixes: ['/1', '/2/'],
      },
      {
        name: 'b',
        prefixes: ['/3'],
      },
      {
        name: 'c',
        prefixes: ['/4/4', '/4/5/'],
      },
      {
        name: 'd',
        prefixes: ['/4/'],
      },
    ]);

    it('routes requests to the first matching queue', () => {
      expect(manager.getQueue('/4/5/foobar')).toHaveProperty('queueName', 'c');
    });

    it('returns null if no queue matches the path', () => {
      expect(manager.getQueue('/5')).toEqual(null);
    });

    it('normalises trailing slashes on prefixes', () => {
      expect(manager.getQueue('/1234')).toEqual(null);
    });

    it('normalises trailing slashes on paths', () => {
      expect(manager.getQueue('/4/5/foobar/')).toHaveProperty('queueName', 'c');
    });
  }

  it('allows a route to match everything', () => {
    const manager = new QueueManager([
      {
        name: 'a',
        prefixes: ['/1'],
      },
      {
        name: 'b',
        prefixes: ['/'],
      },
      {
        name: 'c',
        prefixes: ['/2'],
      },
    ]);
    expect(manager.getQueue('/1')).toHaveProperty('queueName', 'a');
    expect(manager.getQueue('/1/')).toHaveProperty('queueName', 'a');
    expect(manager.getQueue('/2')).toHaveProperty('queueName', 'b');
    expect(manager.getQueue('/')).toHaveProperty('queueName', 'b');
    expect(manager.getQueue('/foo')).toHaveProperty('queueName', 'b');
    expect(manager.getQueue('/foo/')).toHaveProperty('queueName', 'b');
  });
});
