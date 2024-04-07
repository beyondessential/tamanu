import { isArray } from 'lodash';

export function getHL7Link(baseUrl, params = {}) {
  const query = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => {
      const encodedKey = encodeURIComponent(k);
      const toPair = val => `${encodedKey}=${encodeURIComponent(val)}`;
      if (isArray(v)) {
        return v.map(toPair);
      }
      return [toPair(v)];
    })
    .flat()
    .join('&');
  const url = new URL(baseUrl);
  url.search = new URLSearchParams(query);
  return url.toString();
}
