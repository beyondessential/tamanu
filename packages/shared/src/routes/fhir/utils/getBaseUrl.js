import { getCanonicalHostName } from '../../../utils/canonicalHostName';

export function getBaseUrl(req, includePath = true) {
  return new URL(
    `${req.baseUrl}${includePath ? req.path : ''}`,
    getCanonicalHostName(),
  ).toString();
}
