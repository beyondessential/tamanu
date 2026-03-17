export function getHL7Link(baseUrl, params = {}) {
  const url = new URL(baseUrl);
  const searchParams = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined) continue;
    if (Array.isArray(v)) {
      for (const val of v) {
        searchParams.append(k, val);
      }
    } else {
      searchParams.append(k, v);
    }
  }
  url.search = searchParams;
  return url.toString();
}
