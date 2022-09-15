import config from 'config';

export function getBaseUrl(req, includePath = true) {
  return `${config.canonicalHostName}${req.baseUrl}${includePath ? req.path : ''}`;
}
