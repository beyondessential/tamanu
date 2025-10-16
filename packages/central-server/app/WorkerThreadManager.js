import { Worker } from 'worker_threads';
import { totalmem, availableParallelism } from 'os';
import config from 'config';
import { log } from '@tamanu/shared/services/logging';

export class WorkerThreadManager {
  constructor() {
    this.workers = new Map();
    this.isShuttingDown = false;
    this.allWorkersExitedResolve = null;
  }

  async start() {
    log.info('Starting Tamanu Central with worker threads');

    // Calculate scaling based on system resources (same logic as PM2 config)
    const totalMemoryMB = Math.round(totalmem() / 1024 ** 2);
    const availableThreads = availableParallelism();
    const minimumApiScale = totalMemoryMB > 3000 ? 2 : 1;
    const maximumApiScale = 4;
    const defaultApiScale = Math.min(
      maximumApiScale,
      Math.max(minimumApiScale, Math.floor(availableThreads / 2))
    );

    const apiScale = Number(process.env.TAMANU_API_SCALE) || defaultApiScale;
    const basePort = Number(process.env.TAMANU_API_PORT) || 3000;

    // Start API workers
    for (let i = 0; i < apiScale; i++) {
      const port = basePort + i;
      await this.createWorker('api', `api-${i}`, port);
    }

    // Start tasks worker
    await this.createWorker('tasks', 'tasks-1');

    // Start FHIR workers if enabled
    if (config?.integrations?.fhir?.worker?.enabled) {
      await this.createWorker('fhir-refresh', 'fhir-refresh-1');
      await this.createWorker('fhir-resolve', 'fhir-resolve-1');
    }

    // Set up signal handlers
    this.setupSignalHandlers();

    log.info(`Started ${this.workers.size} worker threads`);
  }

  async createWorker(workerType, workerId, port = null) {
    return new Promise((resolve, reject) => {
      const worker = new Worker('./dist/worker.js', {
        workerData: { workerType, workerId, port }
      });

      worker.on('message', (message) => {
        if (message.type === 'ready') {
          log.info(`Worker ${workerId} (${workerType}) is ready`);
          resolve(worker);
        } else if (message.type === 'error') {
          log.error(`Worker ${workerId} (${workerType}) error:`, message.error);
          reject(new Error(message.error));
        }
      });

      worker.on('error', (error) => {
        log.error(`Worker ${workerId} (${workerType}) failed:`, error);
        reject(error);
      });

      worker.on('exit', (code) => {
        if (code !== 0 && !this.isShuttingDown) {
          log.error(`Worker ${workerId} (${workerType}) exited with code ${code}`);
          // Restart worker if not shutting down
          this.restartWorker(workerType, workerId, port);
        } else {
          this.workers.delete(workerId);
          if (this.workers.size === 0 && this.allWorkersExitedResolve) {
            this.allWorkersExitedResolve();
          }
        }
      });

      this.workers.set(workerId, { worker, workerType, port });
    });
  }

  async restartWorker(workerType, workerId, port = null) {
    log.info(`Restarting worker ${workerId} (${workerType})`);
    try {
      await this.createWorker(workerType, workerId, port);
    } catch (error) {
      log.error(`Failed to restart worker ${workerId}:`, error);
    }
  }

  setupSignalHandlers() {
    const shutdown = async (signal) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      log.info(`Received ${signal}, shutting down worker threads`);

      const shutdownPromises = Array.from(this.workers.values()).map(({ worker }) => {
        // Worker has already exited, so we can consider it "shutdown"
        if (worker.threadId === -1) {
          return Promise.resolve();
        }
        return new Promise((resolve) => {
          worker.on('exit', () => resolve());
          worker.terminate();
        });
      });

      await Promise.all(shutdownPromises);
      log.info('All worker threads shut down');
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  async waitForWorkers() {
    return new Promise((resolve) => {
      if (this.workers.size === 0) {
        resolve();
        return;
      }
      this.allWorkersExitedResolve = resolve;
    });
  }
}
