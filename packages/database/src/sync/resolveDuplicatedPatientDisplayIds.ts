import { Sequelize, Op } from 'sequelize';
import type { SyncSnapshotAttributes } from 'types/sync';
import { updateSnapshotRecords } from './manageSnapshotTable';
import type { Patient } from 'models';

/**
 * Resolve duplicated patient display IDs by
 * appending '_duplicate_1' to the display ID of the existing patient
 * and '_duplicate_2' to the display ID of the to-be-synced patient.
 * @param sequelize
 * @param sessionId
 * @param PatientModel
 * @param changes
 */
export const resolveDuplicatedPatientDisplayIds = async (
  sequelize: Sequelize,
  sessionId: string,
  PatientModel: typeof Patient,
  changes: SyncSnapshotAttributes[],
) => {
  const patientDisplayIds = changes.filter((c) => !c.isDeleted).map((c) => c.data.displayId);
  const existingDisplayIds = (
    await PatientModel.findAll({
      attributes: ['displayId'], // Select only the displayId column
      where: { displayId: { [Op.in]: patientDisplayIds } },
      raw: true, // Return plain objects instead of Sequelize models
    })
  ).map((p: Patient) => p.displayId);
  const duplicatedDisplayIds = patientDisplayIds.filter((displayId) =>
    existingDisplayIds.includes(displayId),
  );

  if (duplicatedDisplayIds.length > 0) {
    // Update the existing patient's display ID to append '_duplicate_1'
    await PatientModel.update(
      { displayId: Sequelize.literal(`CONCAT(display_id, '_duplicate_1')`) },
      {
        where: {
          displayId: duplicatedDisplayIds,
        },
      },
    );

    const duplicatedPatientSnapshotIds = changes
      .filter((c) => !c.isDeleted && duplicatedDisplayIds.includes(c.data.displayId))
      .map((c) => c.id);

    // Update the to-be-synced patient's display ID to append '_duplicate_2'
    await updateSnapshotRecords(
      sequelize,
      sessionId,
      {
        data: Sequelize.literal(
          `jsonb_set("data"::jsonb, '{displayId}', ('"' || ("data"->>'displayId') || '_duplicate_2' || '"')::jsonb)`,
        ),
        requiresRepull: true,
      },
      {
        id: duplicatedPatientSnapshotIds,
      },
    );
  }
};
