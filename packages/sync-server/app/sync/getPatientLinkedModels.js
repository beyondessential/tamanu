export function getPatientLinkedModels(models) {
  return Object.fromEntries(
    Object.entries(models).filter(([, model]) => !!model.buildPatientSyncFilter),
  );
}
