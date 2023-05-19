export function createBundledResource(baseUrl, resource) {
  const fullUrl = `${baseUrl}/${resource.id}`;

  // This is explicitly different as the current user of this resource in the
  // "old" API is VPS, and they expect that shape.
  if (baseUrl.endsWith('/DiagnosticReport')) {
    return {
      fullUrl,
      resource,
    };
  }

  return {
    fullUrl,
    // This is explicitly non-compliant with the FHIR spec, to keep compatibility
    // with existing usage. See EPI-261.
    ...resource,
  };
}
