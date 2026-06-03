import { test as base, CDPSession, Page } from '@playwright/test';

/**
 * A WebAuthn virtual authenticator, via the Chromium DevTools Protocol. This
 * answers real `navigator.credentials` calls with a software authenticator, so
 * MFA passkey journeys drive the actual login UI end to end — no physical key
 * and no mocking of the app's WebAuthn calls.
 *
 * Configured to match the passkey choices the app makes: a platform
 * authenticator (`internal`) with resident keys (usernameless) and user
 * verification that always succeeds (the biometric/PIN that makes a passkey
 * count as MFA). Chromium-only — the e2e project already runs Chromium.
 */

export type VirtualAuthenticator = {
  client: CDPSession;
  authenticatorId: string;
  /** Forget all credentials, e.g. to simulate a fresh device. */
  reset: () => Promise<void>;
};

const addVirtualAuthenticator = async (page: Page): Promise<VirtualAuthenticator> => {
  const client = await page.context().newCDPSession(page);
  await client.send('WebAuthn.enable');
  const { authenticatorId } = await client.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      // respond without an explicit user gesture, so tests don't have to
      // simulate a tap
      automaticPresenceSimulation: true,
    },
  });

  const reset = async () => {
    const { credentials } = await client.send('WebAuthn.getCredentials', { authenticatorId });
    await Promise.all(
      credentials.map(({ credentialId }) =>
        client.send('WebAuthn.removeCredential', { authenticatorId, credentialId }),
      ),
    );
  };

  return { client, authenticatorId, reset };
};

export const test = base.extend<{ virtualAuthenticator: VirtualAuthenticator }>({
  virtualAuthenticator: async ({ page }, use) => {
    const authenticator = await addVirtualAuthenticator(page);
    await use(authenticator);
    await authenticator.client.send('WebAuthn.removeVirtualAuthenticator', {
      authenticatorId: authenticator.authenticatorId,
    });
  },
});

export { expect } from '@playwright/test';
