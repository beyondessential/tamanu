import {
  IMAGING_TABLE_STATUS_GROUPINGS,
  LAB_REQUEST_TABLE_STATUS_GROUPINGS,
} from '@tamanu/constants';
import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(
    `UPDATE fhir.service_requests
     SET is_live = false
     WHERE id IN (
        SELECT sr.id FROM fhir.service_requests sr JOIN imaging_requests ir ON sr.upstream_id = ir.id
        WHERE 
          ir.status NOT IN (${IMAGING_TABLE_STATUS_GROUPINGS.ACTIVE.map((status) => `'${status}'`).join(',')})
          AND sr.resolved = true
     )
    `,
  );

  await query.sequelize.query(
    `UPDATE fhir.service_requests
     SET is_live = false
     WHERE id IN (
        SELECT sr.id FROM fhir.service_requests sr JOIN lab_requests lr ON sr.upstream_id = lr.id
        WHERE 
          lr.status NOT IN (${LAB_REQUEST_TABLE_STATUS_GROUPINGS.ACTIVE.map((status) => `'${status}'`).join(',')})
          AND sr.resolved = true
     )
    `,
  );
}

export async function down(): Promise<void> {
  // There's no way to reverse this migration as we won't know the previous `is_live` state
  // This should be fine as the `is_live` field will be recalculated on the next rematerialisation
}
