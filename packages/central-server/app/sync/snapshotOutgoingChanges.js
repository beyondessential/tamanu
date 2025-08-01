import { snake } from 'case';
import {
  COLUMNS_EXCLUDED_FROM_SYNC,
  getSnapshotTableName,
  SYNC_SESSION_DIRECTION,
} from '@tamanu/database/sync';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging/log';
import { withConfig } from '@tamanu/shared/utils/withConfig';
import { getPatientLinkedModels } from './getPatientLinkedModels';

const snapshotChangesForModel = async (
  model,
  since,
  patientCount,
  markedForSyncPatientsTable,
  sessionId,
  facilityIds,
  sessionConfig,
  config,
) => {
  log.debug('snapshotOutgoingChanges.beginCountingModel', {
    model: model.tableName,
    since,
    sessionId,
  });

  const CHUNK_SIZE = config.sync.maxRecordsPerSnapshotChunk;
  const modelHasPatientSyncFilter = !!model.buildPatientSyncFilter;
  const patientSyncFilter = modelHasPatientSyncFilter
    ? model.buildPatientSyncFilter(patientCount, markedForSyncPatientsTable, sessionConfig)
    : '';
  if (modelHasPatientSyncFilter && patientSyncFilter === null) {
    // if patient sync filter is null, it indicates no records will be available so no point in going further
    // e.g. patientIds is empty, so a patient linked filter will produce no data
    return 0;
  }

  const filter = modelHasPatientSyncFilter ? patientSyncFilter : model.buildSyncFilter();

  const { tableName: table } = model;

  const attributes = model.getAttributes();
  const useUpdatedAtByFieldSum = !!attributes.updatedAtByField;

  const snapshotTableName = getSnapshotTableName(sessionId);

  let fromId = '';
  let totalCount = 0;

  while (fromId != null) {
    const [[{ maxId, count }]] = await model.sequelize.query(
      `
      WITH inserted AS (
        INSERT INTO ${snapshotTableName} (
          direction,
          is_deleted,
          record_type,
          record_id,
          saved_at_sync_tick,
          updated_at_by_field_sum,
          data
        )
        SELECT
          '${SYNC_SESSION_DIRECTION.OUTGOING}',
          ${table}.deleted_at IS NOT NULL,
          '${table}',
          ${table}.id,
          ${table}.updated_at_sync_tick,
          ${useUpdatedAtByFieldSum ? 'updated_at_by_field_summary.sum ,' : 'NULL,'}
          json_build_object(
            ${Object.keys(attributes)
              .filter(a => !COLUMNS_EXCLUDED_FROM_SYNC.includes(a))
              .map(a => `'${a}', ${table}.${snake(a)}`)}
          )
        FROM
          ${table}
          ${
            useUpdatedAtByFieldSum
              ? `
        LEFT JOIN (
          SELECT
            ${table}.id, sum(value::text::bigint) sum
          FROM
            ${table}, json_each(${table}.updated_at_by_field)
          GROUP BY
            ${table}.id
        ) updated_at_by_field_summary
        ON
          ${table}.id = updated_at_by_field_summary.id`
              : ''
          }
        ${filter || `WHERE ${table}.updated_at_sync_tick > :since`}
        ${fromId ? `AND ${table}.id > :fromId` : ''}
        ORDER BY ${table}.id
        LIMIT :limit
        RETURNING record_id
      )
      SELECT MAX(record_id) as "maxId",
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
        },
      },
    );

    const chunkCount = parseInt(count, 10); // count should always be default to '0'
    fromId = maxId;
    totalCount += chunkCount;
  }

  log.debug('snapshotOutgoingChanges.countedForModel', {
    count: totalCount,
    model: model.tableName,
    since,
    sessionId,
  });

  return totalCount;
};

const snapshotOutgoingChangesFromModels = withConfig(
  async (
    outgoingModels,
    since,
    patientCount,
    markedForSyncPatientsTable,
    sessionId,
    facilityIds,
    sessionConfig,
    config,
  ) => {
    const invalidModelNames = Object.values(outgoingModels)
      .filter(
        m =>
          ![SYNC_DIRECTIONS.BIDIRECTIONAL, SYNC_DIRECTIONS.PULL_FROM_CENTRAL].includes(
            m.syncDirection,
          ),
      )
      .map(m => m.tableName);

    if (invalidModelNames.length) {
      throw new Error(
        `Invalid sync direction(s) when pulling these models from central: ${invalidModelNames}`,
      );
    }

    let changesCount = 0;

    for (const model of Object.values(outgoingModels)) {
      try {
        const modelChangesCount = await snapshotChangesForModel(
          model,
          since,
          patientCount,
          markedForSyncPatientsTable,
          sessionId,
          facilityIds,
          sessionConfig,
          config,
        );

        changesCount += modelChangesCount || 0;
      } catch (e) {
        log.error(`Failed to snapshot ${model.name}: `);
        log.debug(e);
        throw new Error(`Failed to snapshot ${model.name}: ${e.message}`);
      }
    }

    log.debug('snapshotOutgoingChanges.countedAll', { count: changesCount, since, sessionId });

    return changesCount;
  },
);

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

const snapshotOutgoingChangesFromSyncLookup = withConfig(
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
    return config.sync.lookupTable.enabled
      ? snapshotOutgoingChangesFromSyncLookup(
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
        )
      : snapshotOutgoingChangesFromModels(
          outgoingModels,
          since,
          patientCount,
          markedForSyncPatientsTable,
          sessionId,
          facilityIds,
          sessionConfig,
          config,
        );
  },
);
