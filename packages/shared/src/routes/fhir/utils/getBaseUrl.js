import config from 'config';

export function getBaseUrl(req, includePath = true) {
  return new URL(
    `${req.baseUrl}${includePath ? req.path : ''}`,
    config.canonicalHostName,
  ).toString();
}
