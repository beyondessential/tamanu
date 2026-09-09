import { subDays } from 'date-fns';

import { sleepAsync } from '@tamanu/utils/sleepAsync';

import { ScheduledTask } from '../ScheduledTask';
import { log } from '../../services/logging';

/**
 * Expires the errored jobs left behind in the FHIR job queue.
 *
 * A job that completes deletes its own row, so an errored job is the only kind
 * that outlives its work: the row stays as the record of what went wrong. That
 * record is worth keeping while someone might still act on it and not after, so
 * this drops the ones past the retention window, in batches, to keep a first
 * run on a long-neglected queue from holding the table for minutes at a time.
 */
export class FhirErroredJobCleaner extends ScheduledTask {
  getName() {
    return 'FhirErroredJobCleaner';
  }

  constructor(context, overrideConfig = null) {
    // schedules is settings-resolved before task startup on both server types
    const conf = {
      ...context.schedules?.fhirErroredJobCleaner,
      ...overrideConfig,
    };
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log.child({ task: 'FhirErroredJobCleaner' }), jitterTime, enabled);
    this.config = conf;
    this.store = context.store;
  }

  async run() {
    const { retentionDays, batchSize, batchSleepAsyncDurationInMilliseconds } = this.config;
    // A batch size of zero would make the loop below never finish, and a missing
    // retention window would set the cutoff to an invalid date.
    if (
      !(retentionDays > 0) ||
      !(batchSize > 0) ||
      !(batchSleepAsyncDurationInMilliseconds > 0)
    ) {
      throw new Error(
        `FhirErroredJobCleaner needs a positive retentionDays, batchSize, and batchSleepAsyncDurationInMilliseconds, got ${JSON.stringify(
          { retentionDays, batchSize, batchSleepAsyncDurationInMilliseconds },
        )}`,
      );
    }

    const cutoff = subDays(new Date(), retentionDays);

    let deleted = 0;
    for (;;) {
      const batch = await this.store.models.FhirJob.deleteErroredBefore(cutoff, batchSize);
      deleted += batch;
      if (batch < batchSize) break;
      await sleepAsync(batchSleepAsyncDurationInMilliseconds);
    }

    this.log.info('FhirErroredJobCleaner: expired errored jobs', {
      deleted,
      retentionDays,
      cutoff,
    });
  }
}
