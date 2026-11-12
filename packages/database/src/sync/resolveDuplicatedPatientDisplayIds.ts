import { Op, Sequelize } from 'sequelize';
import type { SyncHookSnapshotChanges, SyncSnapshotAttributes } from 'types/sync';
import type { Patient } from 'models';
import { SYNC_SESSION_DIRECTION } from './constants';
import { sanitizeRecord } from './sanitizeRecord';

/**
 * Resolve duplicated patient display IDs by
 * 1. Creating a new incoming snapshot change for the existing patient's display ID and append '_duplicate_1'
 * 2. Append '_duplicate_2' to the display ID of the to-be-synced patient
 *
 * Display IDs collide case-insensitively: patient search and the edit-time duplicate
 * check both treat them as equal regardless of case, so this safety net must too.
 * Detection is case-insensitive; the rename preserves each display ID's original casing.
 *
 * The new changes will be persisted in the sync_snapshot table
 * @param PatientModel
 * @param changes
 */
export const resolveDuplicatedPatientDisplayIds = async (
  PatientModel: typeof Patient,
  changes: SyncSnapshotAttributes[],
): Promise<SyncHookSnapshotChanges | undefined> => {
  const nonDeletedChanges = changes.filter(c => !c.isDeleted);
  const patientIds = nonDeletedChanges.map(c => c.data.id);
  // A pushed record without a display ID is merged field-wise on save, so skip it here rather
  // than throwing and failing the whole push
  const foldedIncomingDisplayIds = new Set(
    nonDeletedChanges
      .filter(c => typeof c.data.displayId === 'string')
      .map(c => c.data.displayId.toLowerCase()),
  );

  // Find existing patients that have the same displayIDs (case-insensitively) and are not the
  // same as the incoming patients
  const existingPatientsWithDuplicatedDisplayIds = await PatientModel.findAll({
    where: {
      [Op.and]: Sequelize.where(Sequelize.fn('lower', Sequelize.col('display_id')), {
        [Op.in]: [...foldedIncomingDisplayIds],
      }),
      id: { [Op.notIn]: patientIds },
    },
    raw: true, // Return plain objects instead of Sequelize models
  });
  const duplicatedFoldedDisplayIds = new Set(
    existingPatientsWithDuplicatedDisplayIds.map(p => p.displayId.toLowerCase()),
  );

  if (duplicatedFoldedDisplayIds.size > 0) {
    // Create a new incoming snapshot change for the existing patient's display ID and append '_duplicate_1'
    const updatedExistingPatientSnapshotRecords = existingPatientsWithDuplicatedDisplayIds.map(
      r => ({
        direction: SYNC_SESSION_DIRECTION.INCOMING,
        isDeleted: !!r.deletedAt,
        recordType: PatientModel.tableName,
        recordId: r.id,
        data: { ...sanitizeRecord(r), displayId: `${r.displayId}_duplicate_1` },
      }),
    );

    // Update the to-be-synced patient's display ID to append '_duplicate_2'
    const updatedIncomingPatientSnapshotRecords = changes
      .filter(c => !c.isDeleted && duplicatedFoldedDisplayIds.has(c.data.displayId?.toLowerCase()))
      .map(c => ({
        ...c,
        data: { ...c.data, displayId: `${c.data.displayId}_duplicate_2` },
      }));

    return {
      inserts: updatedExistingPatientSnapshotRecords,
      updates: updatedIncomingPatientSnapshotRecords,
    };
  }
};
