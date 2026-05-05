import config from 'config';

/**
 * Default sender address for outgoing email. Prefer `mail.from`; fall back to the legacy
 * `mailgun.from` so existing deployments keep working without a config change.
 */
export function getDefaultFromAddress() {
  return config.mail?.from || config.mailgun?.from || '';
}
