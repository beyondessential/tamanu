import { releaseProxy, wrap } from 'comlink';
import Worker from '../../workers/pdf.worker?worker';

// A process-wide pool of PDF render workers, shared across every render. Each worker loads the
// full react-pdf bundle on first use, so we keep a small number alive and reuse them rather than
// spawning per render — and because the cap is global, several concurrent renders (e.g. two open
// PDF viewers, or a React Query refetch overlapping the previous render) share the same workers
// instead of each launching its own pool and blowing past the concurrency limit.
//
// Concurrency is governed by a permit count; idle workers are reused, and spawned lazily up to
// the cap, then terminated once they've been idle for IDLE_TTL_MS so an idle app doesn't hold the
// bundles in memory indefinitely.
export const MAX_WORKERS = Math.max(1, Math.min(globalThis.navigator?.hardwareConcurrency || 4, 4));
const IDLE_TTL_MS = 30 * 1000;

const waitForWorkerReady = worker =>
  new Promise((resolve, reject) => {
    const handleTimeout = setTimeout(() => {
      cleanup();
      reject(new Error('PDF worker did not signal readiness within 5 minutes'));
    }, 5 * 60 * 1000);

    const handleMessage = event => {
      if (event.data?.type !== 'pdf-render-ready') {
        return;
      }
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      reject(new Error('PDF worker failed to initialise'));
    };

    const cleanup = () => {
      clearTimeout(handleTimeout);
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
    };

    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);
  });

const spawnWorker = async () => {
  const worker = new Worker();
  try {
    await waitForWorkerReady(worker);
  } catch (error) {
    // Readiness timed out or the worker errored before signalling — don't leak the Worker.
    worker.terminate();
    throw error;
  }
  return { worker, proxy: wrap(worker), idleTimer: null };
};

const terminateWorker = entry => {
  if (entry.idleTimer) {
    clearTimeout(entry.idleTimer);
  }
  entry.proxy[releaseProxy]?.();
  entry.worker.terminate();
};

// Concurrency permits: at most MAX_WORKERS tasks run at once. Idle (ready, not-in-use) workers
// are kept on a stack for reuse; a task holds a permit for its whole lifetime.
let availablePermits = MAX_WORKERS;
const idleWorkers = [];
const permitWaiters = [];

const takePermit = () => {
  if (availablePermits > 0) {
    availablePermits -= 1;
    return Promise.resolve();
  }
  return new Promise(resolve => {
    permitWaiters.push(resolve);
  });
};

const releasePermit = () => {
  const waiter = permitWaiters.shift();
  if (waiter) {
    // Pass the permit straight to the next waiter rather than briefly returning it to the pool.
    waiter();
    return;
  }
  availablePermits += 1;
};

const scheduleIdleTermination = entry => {
  entry.idleTimer = setTimeout(() => {
    const index = idleWorkers.indexOf(entry);
    if (index !== -1) {
      idleWorkers.splice(index, 1);
      terminateWorker(entry);
    }
  }, IDLE_TTL_MS);
};

// Run `task` on the next ready worker. A worker that crashes mid-task is destroyed rather than
// returned to the pool; otherwise it's returned for reuse. The permit is always released, so
// queued tasks make progress whether the task succeeds, fails, or its worker dies.
export const withPooledWorker = async (task, { signal } = {}) => {
  await takePermit();

  // If the work was cancelled while queued for a worker (e.g. the viewer closed), bail before
  // taking a worker so we don't start rendering something nobody will see.
  if (signal?.aborted) {
    releasePermit();
    throw signal.reason ?? new Error('PDF render cancelled');
  }

  let entry;
  try {
    const idle = idleWorkers.pop();
    if (idle) {
      clearTimeout(idle.idleTimer);
      idle.idleTimer = null;
      entry = idle;
    } else {
      entry = await spawnWorker();
    }
  } catch (error) {
    // Couldn't get a worker (e.g. it failed to initialise) — free the permit and surface clearly.
    releasePermit();
    throw error;
  }

  // comlink doesn't reject a pending call if the worker dies, so race the task against the
  // worker's error event to avoid hanging forever on a mid-render crash.
  let workerDied = false;
  let signalDeath;
  const death = new Promise((_, reject) => {
    signalDeath = () => {
      workerDied = true;
      reject(new Error('PDF worker crashed during rendering'));
    };
  });
  entry.worker.addEventListener('error', signalDeath);

  try {
    return await Promise.race([task(entry.proxy), death]);
  } finally {
    entry.worker.removeEventListener('error', signalDeath);
    if (workerDied) {
      terminateWorker(entry);
    } else {
      scheduleIdleTermination(entry);
      idleWorkers.push(entry);
    }
    releasePermit();
  }
};
