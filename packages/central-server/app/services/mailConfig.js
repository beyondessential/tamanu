import config from 'config';

/**
 * Default sender address for outgoing email. Prefer the `mail.from` setting; fall back to the
 * legacy `mailgun.from` config so existing deployments keep working.
 */
export async function getDefaultFromAddress(settings) {
  return (await settings.get('mail.from')) || config.mailgun?.from || '';
}
