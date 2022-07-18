export function getPatientDependentModels(models) {
  return models.filter(m => !!m.buildPatientFilter);
}
