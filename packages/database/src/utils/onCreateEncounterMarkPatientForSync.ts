// only single-creates of encounters should mark patients for sync, as anything more aggressive
// would lead to accidentally marking patients for sync when they shouldn't be
// as an example, when a facility has "syncAllLabRequests" turned on, the lab requests encounters
// will sync in, but
// - shouldn't mark the patient for sync when saved during the sync pull process (which uses bulk-create)
// - shouldn't mark the patient for sync when updated as part of processing the lab request (which

import type { Encounter } from '../models';

//   is why we don't trigger on updates)
const HOOK_TRIGGER = 'afterCreate';
const HOOK_NAME = 'markPatientForSync';

// any time an encounter is opened for a non-syncing patient should mark it for ongoing sync
export const onCreateEncounterMarkPatientForSync = (encounterModel: typeof Encounter) => {
  // we remove and add the hook because Sequelize doesn't have a good way
  // to detect which hooks have already been added to a model in its
  // public API
  encounterModel.removeHook(HOOK_TRIGGER, HOOK_NAME);
  encounterModel.addHook(HOOK_TRIGGER, HOOK_NAME, async (record: Encounter, { transaction }) => {
    const { patientId, locationId } = record;
    const location = await encounterModel.sequelize.models.Location.findByPk(locationId);

    // upsert patient_facilities record to mark the patient for sync in this facility
    await encounterModel.sequelize?.query(
      `
      INSERT INTO patient_facilities (patient_id, facility_id, last_interacted_time)
      VALUES (:patientId, :facilityId, :lastInteractedTime)
      ON CONFLICT (patient_id, facility_id) DO UPDATE SET last_interacted_time = :lastInteractedTime;
    `,
      {
        replacements: {
          patientId,
          facilityId: location?.facilityId,
          lastInteractedTime: new Date()
        },
        // if the patient was created within a transaction, it may not be committed when the hook
        // fires, so this query needs to run in the same transaction
        transaction,
      },
    );
  });
};
