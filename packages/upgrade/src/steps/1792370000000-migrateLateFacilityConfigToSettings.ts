import { FACT_FACILITY_LATE_CONFIG_MIGRATED } from '@tamanu/constants';

import type { Steps, StepArgs } from '../step.ts';
import { END } from '../step.js';
import {
  facilityConfigRows,
  writeCarrierRows,
} from './1785000000001-migrateFacilityConfigToSettings.js';

// Keys added to CONFIG_TO_SETTINGS after servers had already run the one-off facility
// migration, which is fact-gated and won't pick them up. Central applies each carrier row
// only when the facility has no setting recorded for that key.
export const LATE_FACILITY_KEYS = [
  'sync.schedule',
  'sync.jitterTime',
  'sync.timeout',
  'sync.backoff',
  'sync.dynamicLimiter',
  'sync.assertIfPulledRecordsUpdatedAfterPushSnapshot',
];

export const STEPS: Steps = [
  {
    at: END,
    async check({ serverType, models: { LocalSystemFact } }: StepArgs) {
      return (
        serverType === 'facility' &&
        !(await LocalSystemFact.get(FACT_FACILITY_LATE_CONFIG_MIGRATED))
      );
    },
    async run(args: StepArgs) {
      const rows = facilityConfigRows().filter(row => LATE_FACILITY_KEYS.includes(row.key));
      const complete = await writeCarrierRows(rows, args, 'migrateLateFacilityConfigToSettings');
      if (complete) {
        await args.models.LocalSystemFact.set(FACT_FACILITY_LATE_CONFIG_MIGRATED, args.toVersion);
      }
    },
  },
];
