// When adding to this:
// - add the migration for the fhir.Name resource table
//   - don't forget the trigger to update the version_id and add to versioning
// - add the migration for the versioning table:
//   - the fhir.resource_enum type
//   - the fhir.resource_type enum
//
// must be in dependency order
export const FHIR_RESOURCE_TYPES = ['Patient', 'Practitioner', 'ServiceRequest'];
