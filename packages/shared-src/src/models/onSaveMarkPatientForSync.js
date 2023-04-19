import config from 'config';

// by default, we use "afterCreate" as the hook trigger
// only single-creates of related tables should mark patients for sync, as anything more aggressive
// would lead to accidentally marking patients for sync when they shouldn't be
// as an example, when a facility has "syncAllLabRequests" turned on, the lab requests encounters
// will sync in, but
// - shouldn't mark the patient for sync when saved during the sync pull process (which uses bulk-create)
// - shouldn't mark the patient for sync when updated as part of processing the lab request (which
//   is why we don't trigger on updates)
const DEFAULT_HOOK_TRIGGER = 'afterCreate';
const HOOK_NAME = 'markPatientForSync';
const DEFAULT_PATIENT_ID_FIELD = 'patientId';

// any interaction with a non-syncing patient should mark it for ongoing sync
export const onSaveMarkPatientForSync = (
  model,
  patientIdField = DEFAULT_PATIENT_ID_FIELD,
  hookTrigger = DEFAULT_HOOK_TRIGGER,
) => {
  const facilityId = config.serverFacilityId;
  if (!facilityId) {
    // no need to add the hook on the central server
    return;
  }

  // we remove and add the hook because Sequelize doesn't have a good way
  // to detect which hooks have already been added to a model in its
  // public API
  model.removeHook(hookTrigger, HOOK_NAME);
  model.addHook(hookTrigger, HOOK_NAME, async (record, { transaction }) => {
    // for some models (e.g. DocumentMetadata) patient is an optional field; check it is defined
    const patientId = record[patientIdField];
    if (!patientId) {
      return;
    }

    // upsert patient_facilities record to mark the patient for sync in this facility
    await model.sequelize.query(
      `
      INSERT INTO patient_facilities (patient_id, facility_id)
      VALUES (:patientId, :facilityId )
      ON CONFLICT (patient_id, facility_id) DO NOTHING;
    `,
      {
        replacements: { patientId, facilityId },
        // if the patient was created within a transaction, it may not be committed when the hook
        // fires, so this query needs to run in the same transaction
        transaction,
      },
    );
  });
};
