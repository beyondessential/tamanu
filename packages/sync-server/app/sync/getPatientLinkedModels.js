const NON_PATIENT_MODELS_WITH_SYNC_FILTERS = ['PatientFacility', 'Setting'];

// may need to change this is if models start filtering by something other than patients (outside
// of the two current exceptions, PatientFacility and Setting)
export function getPatientLinkedModels(models) {
  return Object.fromEntries(
    Object.entries(models).filter(
      ([, model]) =>
        !!model.buildSyncFilter && !NON_PATIENT_MODELS_WITH_SYNC_FILTERS.includes(model.name),
    ),
  );
}
