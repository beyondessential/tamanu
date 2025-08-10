import { Op } from 'sequelize';
import type { SyncHookSnapshotChanges, SyncSnapshotAttributes } from 'types/sync';
import type { Patient } from 'models';
import { SYNC_SESSION_DIRECTION } from '../constants';
import { sanitizeRecord } from '../sanitizeRecord';

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
    // Create a new incoming snapshot change for the existing patient's display ID and append '_duplicate_1'
    const updatedExistingPatientSnapshotRecords = existingPatientsWithDuplicatedDisplayIds.map(
      (r) => ({
        direction: SYNC_SESSION_DIRECTION.INCOMING,
        isDeleted: !!r.deletedAt,
        recordType: PatientModel.tableName,
        recordId: r.id,
        data: { ...sanitizeRecord(r), displayId: `${r.displayId}_duplicate_1` },
      }),
    );

    // Update the to-be-synced patient's display ID to append '_duplicate_2'
    const updatedIncomingPatientSnapshotRecords = changes
      .filter((c) => !c.isDeleted && duplicatedDisplayIds.includes(c.data.displayId))
      .map((c) => ({
        ...c,
        data: { ...c.data, displayId: `${c.data.displayId}_duplicate_2` },
      }));

    return {
      inserts: updatedExistingPatientSnapshotRecords,
      updates: updatedIncomingPatientSnapshotRecords,
    };
  }
};
