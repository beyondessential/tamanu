/**
 * Default sender address for outgoing email. The legacy `mailgun.from` config is served
 * through the settings config fallback (see CONFIG_TO_SETTINGS), so existing deployments
 * keep working.
 */
export async function getDefaultFromAddress(settings) {
  return (await settings.get('mail.from')) || '';
}
