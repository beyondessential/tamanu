// may need to change this is if models start filtering by something other than patients (outside
// of the current single exception, PatientFacility)
export function getPatientLinkedModels(models) {
  return Object.fromEntries(
    Object.entries(models).filter(
      ([, model]) => !!model.buildSyncFilter && model.name !== 'PatientFacility',
    ),
  );
}
