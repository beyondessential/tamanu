import { ScheduledTask } from '../ScheduledTask';
import { log } from '../../services/logging';

/**
 * Prunes the worker registry of workers that stopped heartbeating without
 * deregistering.
 *
 * A worker that crashed or was killed leaves its row behind with a frozen
 * heartbeat. The jobs it had grabbed are already back in the pool — the queue
 * treats a worker as dead once its heartbeat is older than
 * `fhir.worker.assumeDroppedAfter` — but nothing reclaims the row itself, so
 * without this the registry grows by one row for every worker that has ever
 * died, and an operator reading it cannot tell a worker that died this minute
 * from one that died last year.
 */
export class FhirJobWorkerCleaner extends ScheduledTask {
  getName() {
    return 'FhirJobWorkerCleaner';
  }

  constructor(context, overrideConfig = null) {
    // schedules is settings-resolved before task startup on both server types
    const conf = {
      ...context.schedules?.fhirJobWorkerCleaner,
      ...overrideConfig,
    };
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log.child({ task: 'FhirJobWorkerCleaner' }), jitterTime, enabled);
    this.config = conf;
    this.store = context.store;
  }

  async run() {
    const pruned = await this.store.models.FhirJobWorker.clearDead();
    this.log.info('FhirJobWorkerCleaner: pruned dead workers', { pruned });
  }
}
