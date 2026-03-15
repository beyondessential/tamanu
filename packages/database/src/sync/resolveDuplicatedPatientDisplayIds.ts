import { Op, QueryTypes } from 'sequelize';
import { randomUUID } from 'node:crypto';
import { SYSTEM_USER_UUID } from '@tamanu/constants';
import { FACT_DEVICE_ID, FACT_CURRENT_VERSION } from '@tamanu/constants/facts';
import type { SyncHookSnapshotChanges, SyncSnapshotAttributes } from 'types/sync';
import type { Patient } from 'models';
import { SYNC_SESSION_DIRECTION } from './constants';
import { sanitizeRecord } from './sanitizeRecord';

/**
 * Resolve duplicated patient display IDs by
 * 1. Creating a new incoming snapshot change for the existing patient's display ID and append '_duplicate_1'
 * 2. Append '_duplicate_2' to the display ID of the to-be-synced patient
 *
 * The new changes will be persisted in the sync_snapshot table
 * @param sequelize
 * @param sessionId
 * @param PatientModel
 * @param changes
 */
export const resolveDuplicatedPatientDisplayIds = async (
  PatientModel: typeof Patient,
  changes: SyncSnapshotAttributes[],
): Promise<SyncHookSnapshotChanges | undefined> => {
  const nonDeletedChanges = changes.filter((c) => !c.isDeleted);
  const patientDisplayIds = nonDeletedChanges.map((c) => c.data.displayId);
  const patientIds = nonDeletedChanges.map((c) => c.data.id);

  // Find existing patients that have the same displayIDs and are not the same with the incoming patients
  const existingPatientsWithDuplicatedDisplayIds = await PatientModel.findAll({
    where: { displayId: { [Op.in]: patientDisplayIds }, id: { [Op.notIn]: patientIds } },
    raw: true, // Return plain objects instead of Sequelize models
  });
  const existingDisplayIds = existingPatientsWithDuplicatedDisplayIds.map((p) => p.displayId);
  const duplicatedDisplayIds = patientDisplayIds.filter((displayId) =>
    existingDisplayIds.includes(displayId),
  );

  if (duplicatedDisplayIds.length > 0) {
    const sequelize = PatientModel.sequelize!;
    const [tableOidResult] = await sequelize.query<{ oid: number }>(
      `SELECT oid FROM pg_class WHERE relname = 'patients' AND relnamespace = 'public'::regnamespace`,
      { type: QueryTypes.SELECT },
    );
    const tableOid = tableOidResult!.oid;
    const [deviceIdFact, versionFact] = await Promise.all([
      sequelize.query<{ value: string }>(
        `SELECT value FROM local_system_facts WHERE key = :key`,
        { replacements: { key: FACT_DEVICE_ID }, type: QueryTypes.SELECT },
      ),
      sequelize.query<{ value: string }>(
        `SELECT value FROM local_system_facts WHERE key = :key`,
        { replacements: { key: FACT_CURRENT_VERSION }, type: QueryTypes.SELECT },
      ),
    ]);
    const deviceId = deviceIdFact[0]?.value ?? 'unknown';
    const version = versionFact[0]?.value ?? 'unknown';

    // Create a new incoming snapshot change for the existing patient's display ID and append '_duplicate_1'
    const updatedExistingPatientSnapshotRecords = existingPatientsWithDuplicatedDisplayIds.map(
      (r) => {
        const newData = { ...sanitizeRecord(r), displayId: `${r.displayId}_duplicate_1` };
        const now = new Date();
        return {
          direction: SYNC_SESSION_DIRECTION.INCOMING,
          isDeleted: !!r.deletedAt,
          recordType: PatientModel.tableName,
          recordId: r.id,
          data: newData,
          changelogRecords: [
            {
              id: randomUUID(),
              tableOid,
              tableSchema: 'public',
              tableName: PatientModel.tableName,
              loggedAt: now,
              updatedByUserId: SYSTEM_USER_UUID,
              recordId: r.id,
              recordCreatedAt: r.createdAt,
              recordUpdatedAt: now,
              recordDeletedAt: r.deletedAt ?? null,
              recordData: newData,
              deviceId,
              version,
              reason: 'Automated: duplicate displayId resolution during sync',
              migrationContext: null,
            },
          ],
        };
      },
    );

    // Update the to-be-synced patient's display ID to append '_duplicate_2'
    // Strip changelogRecords so updateSnapshotRecords doesn't overwrite the column;
    // the original value in the DB row (pushed by the facility) is preserved
    const updatedIncomingPatientSnapshotRecords = changes
      .filter((c) => !c.isDeleted && duplicatedDisplayIds.includes(c.data.displayId))
      .map((c) => {
        const updated = {
          ...c,
          data: { ...c.data, displayId: `${c.data.displayId}_duplicate_2` },
        };
        delete (updated as any).changelogRecords;
        return updated;
      });

    return {
      inserts: updatedExistingPatientSnapshotRecords,
      updates: updatedIncomingPatientSnapshotRecords,
    };
  }
};
