// When a resource is included in a bundle it needs an extra wrapping.
// This should only be done for main resources ATM.
export function createBundledResource(baseUrl, resource) {
  return {
    fullUrl: `${baseUrl}/${resource.id}`,
    resource,
  };
}
