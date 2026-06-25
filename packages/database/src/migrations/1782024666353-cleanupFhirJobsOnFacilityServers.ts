import { QueryInterface } from 'sequelize';
import config from 'config';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

/**
 * We're cleaning up historical jobs on facility servers which were unintentionally created
 * by fhir triggers being abled on all servers regardless of if fhir is enabled.
 */
export async function up(query: QueryInterface): Promise<void> {
  const isFacility = Boolean(selectFacilityIds(config));
  if (!isFacility) {
    return;
  }

  const fhirEnabled = !!config?.integrations?.fhir?.enabled;
  if (fhirEnabled) {
    return;
  }

  await query.sequelize.query('TRUNCATE fhir.jobs');
}

export async function down(_query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: cannot restore deleted FHIR jobs
}
