export function getPatientDependentModels(models) {
  return Object.fromEntries(
    Object.entries(models).filter(([modelName, model]) => !!model.buildPatientFilter),
  );
}
