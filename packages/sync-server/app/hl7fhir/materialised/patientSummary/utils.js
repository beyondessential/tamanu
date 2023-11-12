export const getPatientDisplayName = patient =>
  [patient.firstName, patient.lastName].filter(x => x).join(' ');

export const getEntryResourceSubject = patient => ({
  reference: `Patient/${patient.id}`,
  display: getPatientDisplayName(patient),
});

export const getBundleEntryFromResource = resource => ({
  fullUrl: `urn:uuid:${resource.id}`,
  resource,
});
