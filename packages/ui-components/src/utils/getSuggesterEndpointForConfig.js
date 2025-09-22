// Required due to web/mobile using different implementations for
// suggesters (due to using different db's). Mobile has the more generic
// approach already, so do the extra step here.
export const getSuggesterEndpointForConfig = config => {
  if (config?.source === 'ReferenceData') {
    const type = config.where?.type;
    return type === 'icd10' ? 'diagnosis' : type;
  }
  if (config?.source === 'Facility') return 'facility';
  if (config?.source === 'Location') return 'location';
  if (config?.source === 'Department') return 'department';
  if (config?.source === 'User') return 'practitioner';
  if (config?.source === 'LocationGroup') {
    return config.scope === 'allFacilities' ? 'locationGroup' : 'facilityLocationGroup';
  }
  if (config?.source === 'Village') return 'village';
  if (config?.source === 'ProgramRegistryClinicalStatus') return 'programRegistryClinicalStatus';

  // autocomplete component won't crash when given an invalid endpoint, it just logs an error.
  return null;
};
