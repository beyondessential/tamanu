import config from 'config';

const HOOK_TRIGGER = 'beforeSave';
const HOOK_NAME = 'markPatientForSync';

// any interaction with a non-syncing patient should mark it for ongoing sync
export const onSaveMarkPatientForSync = (model, patientIdField = 'patientId') => {
  const facilityId = config.serverFacilityId;
  if (!facilityId) {
    // no need to add the hook on the central server
    return;
  }

  // we remove and add the hook because Sequelize doesn't have a good way
  // to detect which hooks have already been added to a model in its
  // public API
  model.removeHook(HOOK_TRIGGER, HOOK_NAME);
  model.addHook(HOOK_TRIGGER, HOOK_NAME, async record => {
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
      { replacements: { patientId, facilityId } },
    );
  });
};
