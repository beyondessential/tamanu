import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

import { repairReportingGrants } from '../services/reporting';

/**
 * Reporting schema scripts open with `DROP SCHEMA reporting CASCADE`, which takes the
 * reporting role's grants with it: the schema ACL and the default privileges keyed to
 * that schema both go. Only startup re-applied them, so recovering meant restarting
 * every facility server. This re-applies them in place instead.
 */
export class ReportingGrantRepair extends ScheduledTask {
  getName() {
    return 'ReportingGrantRepair';
  }

  constructor(context) {
    const { schedule, jitterTime, enabled } = context.schedules.reportingGrantRepair;
    super(schedule, log, jitterTime, enabled);
    this.context = context;
  }

  async run() {
    const repaired = await repairReportingGrants(this.context.store);
    if (repaired.length === 0) return;

    log.info('ReportingGrantRepair: re-applied reporting grants', {
      connections: repaired.join(', '),
    });
  }
}
