import { getSnapshotTableName, SYNC_SESSION_DIRECTION } from '@tamanu/shared/sync';
import { log } from '@tamanu/shared/services/logging/log';
import { withConfig } from '@tamanu/shared/utils/withConfig';
import { getPatientLinkedModels } from './getPatientLinkedModels';

function getPatientRelatedWhereClause(
  models,
  recordTypes,
  patientCount,
  markedForSyncPatientsTable,
) {
  const recordTypesLinkedToPatients = Object.values(getPatientLinkedModels(models)).map(
    m => m.tableName,
  );
  const allRecordTypesAreForPatients = recordTypes.every(recordType =>
    recordTypesLinkedToPatients.includes(recordType),
  );

  if (allRecordTypesAreForPatients) {
    if (patientCount) {
      return `patient_id IN (SELECT patient_id FROM ${markedForSyncPatientsTable})`;
    }
    return 'FALSE';
  }
  if (!allRecordTypesAreForPatients) {
    if (patientCount) {
      return `(patient_id IS NULL OR patient_id IN (SELECT patient_id FROM ${markedForSyncPatientsTable}))`;
    }
    return 'patient_id IS NULL';
  }
}

export const snapshotOutgoingChanges = withConfig(
  async (
    store,
    outgoingModels,
    since,
    patientCount,
    markedForSyncPatientsTable,
    sessionId,
    facilityIds,
    deviceId,
    sessionConfig,
    config,
  ) => {
    let fromId = '';
    let totalCount = 0;
    const snapshotTableName = getSnapshotTableName(sessionId);
    const CHUNK_SIZE = config.sync.maxRecordsPerSnapshotChunk;
    const { avoidRepull } = config.sync.lookupTable;
    const { syncAllLabRequests } = sessionConfig;
    const recordTypes = Object.values(outgoingModels).map(m => m.tableName);
    while (fromId != null) {
      const [[{ maxId, count }]] = await store.sequelize.query(
        `
      WITH inserted AS (
        INSERT INTO ${snapshotTableName} (
          sync_lookup_id,
          direction,
          is_deleted,
          record_type,
          record_id,
          saved_at_sync_tick,
          updated_at_by_field_sum,
          data
        )
        SELECT
          id,
          '${SYNC_SESSION_DIRECTION.OUTGOING}',
          is_deleted,
          record_type,
          record_id,
          updated_at_sync_tick,
          updated_at_by_field_sum,
          data
        FROM
          sync_lookup
        WHERE updated_at_sync_tick > :since
        ${fromId ? `AND id > :fromId` : ''}
        AND (
          --- either no patient_id (meaning we don't care if the record is associate to a patient, eg: reference_data)
          --- or patient_id has to match the marked for sync patient_ids, eg: encounters
          ${getPatientRelatedWhereClause(
            store.models,
            recordTypes,
            patientCount,
            markedForSyncPatientsTable,
          )}
          --- either no facility_id (meaning we don't care if the record is associate to a facility, eg: reference_data)
          --- or facility_id has to match the current facility, eg: patient_facilities
          AND (
            facility_id IS NULL
            OR
            facility_id in (:facilityIds)
          )
          --- if syncAllLabRequests is on then sync all records with is_lab_request IS TRUE
          ${
            syncAllLabRequests
              ? `
            OR is_lab_request IS TRUE
          `
              : ''
          }
        )
        AND record_type IN (:recordTypes)
        ${
          avoidRepull && deviceId
            ? 'AND (pushed_by_device_id <> :deviceId OR pushed_by_device_id IS NULL)'
            : ''
        }
        ORDER BY id
        LIMIT :limit
        RETURNING sync_lookup_id
      )
      SELECT MAX(sync_lookup_id) as "maxId",
        count(*) as "count"
      FROM inserted;
    `,
        {
          replacements: {
            sessionId,
            since,
            // include replacement params used in some model specific sync filters outside of this file
            // see e.g. Referral.buildSyncFilter
            facilityIds,
            limit: CHUNK_SIZE,
            fromId,
            recordTypes,
            deviceId,
          },
        },
      );

      const chunkCount = parseInt(count, 10); // count should always be default to '0'

      fromId = maxId;
      totalCount += chunkCount;
    }

    log.info('snapshotOutgoingChangesFromSyncLookup.countedAll', {
      count: totalCount,
      since,
      sessionId,
      deviceId,
    });

    return totalCount;
  },
);
