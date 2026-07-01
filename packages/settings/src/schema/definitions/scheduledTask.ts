import * as yup from 'yup';
import { SETTING_EDITORS } from '@tamanu/constants';

import type { Setting, SettingsSchema } from '../../types';

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
// optional random start delay, plus any task-specific tuning knobs. Schedule changes
// take effect when the server restarts.
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
      description: 'Cron expression for when this task runs (applies on server restart)',
      type: cronExpressionSchema,
      defaultValue: schedule,
      editor: SETTING_EDITORS.CRON,
    },
    jitterTime: {
      name: 'Jitter',
      description:
        'Maximum random delay added to each run, e.g. ‘30s’, so tasks on many servers don’t all fire at once',
      type: yup.string().nullable(),
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

export const limitProperty = (limit: number): Record<string, Setting> => ({
  limit: {
    name: 'Limit',
    description: 'Process at most this many records per task run',
    type: yup.number().integer().positive(),
    defaultValue: limit,
  },
});
