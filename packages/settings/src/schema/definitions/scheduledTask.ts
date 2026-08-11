import * as yup from 'yup';
import { SETTING_EDITORS } from '@tamanu/constants';

import type { Setting, SettingsSchema } from '../../types';
import { msDurationSchema } from './msDuration';

// Field-count and charset check only; full parsing is node-schedule's job at task
// start, and the admin UI shows a live human-readable preview via cronstrue.
const CRON_PATTERN = /^([\dA-Za-z*,/?-]+\s+){4,5}[\dA-Za-z*,/?-]+$/;

export const cronExpressionSchema = yup
  .string()
  .matches(
    CRON_PATTERN,
    'must be a 5 or 6 field cron expression (a leading 6th field schedules seconds)',
  );

// Common shape for a scheduled background task: on/off switch, cron schedule, and an
// optional random start delay, plus any task-specific tuning knobs. Everything here is
// snapshot at server startup, so the whole schedules subtree is requiresRestart.
export const scheduledTaskSchema = (
  { schedule, enabled = true, jitterTime = null }: {
    schedule: string;
    enabled?: boolean;
    jitterTime?: string | null;
  },
  extraProperties: Record<string, Setting | SettingsSchema> = {},
): SettingsSchema => ({
  properties: {
    enabled: {
      name: 'Enabled',
      description: 'Whether this task runs at all',
      type: yup.boolean(),
      defaultValue: enabled,
    },
    schedule: {
      name: 'Schedule',
      description: 'Cron expression for when this task runs',
      type: cronExpressionSchema,
      defaultValue: schedule,
      editor: SETTING_EDITORS.CRON,
    },
    jitterTime: {
      name: 'Jitter',
      description:
        'Maximum random delay added to each run, e.g. ‘30s’, so tasks on many servers don’t all fire at once',
      type: msDurationSchema.nullable(),
      defaultValue: jitterTime,
    },
    ...extraProperties,
  },
});

// Shared tuning knobs used by several tasks.
export const batchingProperties = (
  batchSize: number,
  batchSleepAsyncDurationInMilliseconds: number,
): Record<string, Setting> => ({
  batchSize: {
    name: 'Batch size',
    description: 'Process all queued records in one run, in batches of this many',
    type: yup.number().integer().positive(),
    defaultValue: batchSize,
  },
  batchSleepAsyncDurationInMilliseconds: {
    name: 'Batch sleep',
    description: 'Pause between batches',
    type: yup.number().integer().positive(),
    defaultValue: batchSleepAsyncDurationInMilliseconds,
    unit: 'ms',
  },
});

// spec: SCRUB
// Per-pass bounds for the blob integrity scrub. The scrub is incremental, so
// these decide how quickly the store is covered rather than whether it is: a
// pass takes the least-recently-scrubbed blobs until it hits either bound, and
// the next pass carries on from wherever that left the population.
export const blobScrubProperties = (): Record<string, Setting> => ({
  maxBlobsPerPass: {
    name: 'Blobs per pass',
    description:
      'Most blobs one scrub pass verifies. Together with the schedule this sets how long a full cycle of the store takes',
    type: yup.number().integer().positive(),
    defaultValue: 500,
  },
  maxGigabytesPerPass: {
    name: 'Gigabytes per pass',
    description:
      'Most content one scrub pass reads. Verification is disk-read bound, so this is what keeps the scrub off the same IO the clinical workload needs',
    type: yup.number().positive(),
    defaultValue: 2,
    unit: 'GB',
  },
});

// spec: RECL
// The safety window and per-pass bounds for central orphan collection. Orphans
// are rare and nothing is waiting on the space they occupy, so every bound here
// is set to retain content rather than to converge quickly: a pass that stops
// early leaves the rest for the next one.
export const blobReclamationProperties = (): Record<string, Setting> => ({
  safetyWindow: {
    name: 'Safety window',
    description:
      'Content admitted more recently than this is retained whatever references it, so a blob whose reference is still being written is never collected',
    type: msDurationSchema,
    // The gap between admitting content and writing the reference that names it
    // is one request; a week is orders of magnitude beyond it.
    defaultValue: '7d',
  },
  maxBlobsPerPass: {
    name: 'Blobs per pass',
    description:
      'Most orphans one pass collects. A bound on how much content a single pass can remove, so a run that finds far more than expected is throttled rather than trusted',
    type: yup.number().integer().positive(),
    defaultValue: 100,
  },
  maxGigabytesPerPass: {
    name: 'Gigabytes per pass',
    description: 'Most content one pass reclaims. The pass stops once it has freed this much',
    type: yup.number().positive(),
    defaultValue: 1,
    unit: 'GB',
  },
});

export const limitProperty = (limit: number): Record<string, Setting> => ({
  limit: {
    name: 'Limit',
    description: 'Process at most this many records per task run',
    type: yup.number().integer().positive(),
    defaultValue: limit,
  },
});
