/**
 * Whether a server origin is covered by a WebAuthn relying party ID.
 *
 * WebAuthn requires the RP ID to be a registrable suffix of (or equal to) the
 * origin's domain. Tamanu deployments share a common domain stem
 * (`auth.mfa.webauthn.rpid`, e.g. `foo.bar.com` for `central.foo.bar.com` and
 * `facility-a.foo.bar.com`), so one passkey works across every server under
 * the stem. A server whose origin is not under the stem must not offer
 * WebAuthn at all — the browser would refuse the ceremony anyway.
 *
 * The comparison is label-aware: a naïve `endsWith(rpId)` would let
 * `evilfoo.bar.com` match `foo.bar.com`. This mirrors the check browsers
 * themselves enforce.
 *
 * @param {string} origin - the server's own trusted origin (e.g.
 *   `canonicalHostName`): a URL, or a bare host[:port]
 * @param {string} rpId - the configured relying party ID; empty disables WebAuthn
 * @returns {boolean}
 */
export function originIsUnderRpId(origin, rpId) {
  const stem = rpId?.trim().toLowerCase();
  if (!stem) return false;

  let host = origin?.trim().toLowerCase();
  if (!host) return false;
  if (host.includes('://')) {
    try {
      host = new URL(host).hostname;
    } catch (_err) {
      return false;
    }
  } else {
    [host] = host.split(':');
  }

  return host === stem || host.endsWith(`.${stem}`);
}
