import { isMainThread, parentPort, workerData } from 'worker_threads';
import { log } from '@tamanu/shared/services/logging';
import { startApi } from './subCommands/startApi.js';
import { startTasks } from './subCommands/startTasks.js';
import { startFhirWorker } from './subCommands/startFhirWorker.js';

if (isMainThread) {
  throw new Error('This file should only be used as a worker thread');
}

const { workerType, workerId, port } = workerData;

log.info(`Starting worker thread ${workerId} for ${workerType}`);

function getWorkerFunction(type) {
  switch (type) {
    case 'api': {
      return () => startApi({ skipMigrationCheck: true });
    }

    case 'tasks': {
      return () => startTasks({ skipMigrationCheck: true });
    }

    case 'fhir-refresh': {
      return () => startFhirWorker({
        name: 'refresh',
        skipMigrationCheck: true,
        topics: 'fhir.refresh.allFromUpstream,fhir.refresh.entireResource,fhir.refresh.fromUpstream'
      });
    }

    case 'fhir-resolve': {
      return () => startFhirWorker({
        name: 'resolver',
        skipMigrationCheck: true,
        topics: 'fhir.resolver'
      });
    }

    default:
      throw new Error(`Unknown worker type: ${type}`);
  }
}

async function startWorker() {
  try {
    const workerFunction = getWorkerFunction(workerType);

    if (workerType === 'api' && port) {
      process.env.PORT = port.toString();
    }

    await workerFunction();
  } catch (error) {
    log.error(`Worker thread ${workerId} (${workerType}) failed:`, error);
    parentPort.postMessage({ type: 'error', error: error.message });
  }
}

startWorker();
parentPort.postMessage({ type: 'ready', workerType, workerId });
