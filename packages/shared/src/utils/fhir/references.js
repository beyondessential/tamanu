/*
  FHIR references can have three different formats:
  - id
  - Type/id
  - Full URL (e.g. http://example.com/fhir/Patient/123)

  Read more: http://hl7.org/fhir/search.html#reference
*/
export function parseFhirReference(reference) {
  const parts = reference.split('/');
  return {
    resourceType: parts.length >= 2 ? parts[parts.length - 2] : null,
    id: parts[parts.length - 1],
  };
}
