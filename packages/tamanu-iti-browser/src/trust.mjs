import https from 'node:https';
import tls from 'node:tls';

/**
 * Trust enforcement for the Tamanu Iti Browser.
 *
 * The whole point: the facility connection must chain to the BES CA *only*
 * (public CAs are NOT acceptable for it), and the certificate's SAN must equal
 * the facility identity we asked for — regardless of which IP we actually
 * dialled. This is done in the agent's own TLS client, in ordinary code, with a
 * trust store scoped to just the BES anchor. The browser never participates in
 * this decision (it only ever talks to http://<uuid>.localhost).
 *
 * `expectedHost` is the facility identity (the SAN, e.g. `<uuid>.facility.internal`).
 */
export function pinnedTlsOptions({ caPem, expectedHost }) {
  return {
    // Replaces the default root set: ONLY the BES CA is trusted. A public
    // (e.g. Let's Encrypt) certificate for the facility is therefore rejected.
    ca: caPem,
    // The candidate address is an IP; force SNI + identity check to the
    // facility identity so IP churn never affects trust.
    servername: expectedHost,
    checkServerIdentity: (_host, cert) => tls.checkServerIdentity(expectedHost, cert),
  };
}

export function makePinnedAgent({ caPem, expectedHost }) {
  return new https.Agent({ ...pinnedTlsOptions({ caPem, expectedHost }), keepAlive: true });
}
