import type { Device } from '@tamanu/database/models';

const CHALLENGE_NONCE_LENGTH = 64;
const ED25519_SIGNATURE_LENGTH = 64;

export async function constructChallenge({ models: { LocalSystemFact } }): Promise<string> {
  const nonce = new Uint8Array(CHALLENGE_NONCE_LENGTH);
  crypto.getRandomValues(nonce);

  const signature = await LocalSystemFact.sign(nonce);
  return Buffer.concat([nonce, signature]).toString('base64');
}

export async function verifyChallenge(
  challenge: string,
  deviceId: string,
  {
    user,
    store: {
      models: { LocalSystemFact, SyncDevice },
    },
  },
): Promise<{ device: Device; sessionId: string }> {
  const challengeBuffer = Buffer.from(challenge, 'base64');
  const devicePubkey = Buffer.from(deviceId, 'hex');

  // challenge looks like: nonce + deviceSignature + serverSignature
  // server has signed the nonce
  // client has signed the nonce + serverSignature

  // verify that the device signed the challenge
  const deviceChallenge = challengeBuffer.subarray(
    0,
    CHALLENGE_NONCE_LENGTH + ED25519_SIGNATURE_LENGTH,
  );
  const deviceSignature = challengeBuffer.subarray(
    CHALLENGE_NONCE_LENGTH + ED25519_SIGNATURE_LENGTH,
  );
  if (deviceSignature.length !== ED25519_SIGNATURE_LENGTH) {
    throw new Error('Invalid device signature length');
  }
  if (!SyncDevice.verifySignatureFromPublicKey(deviceChallenge, deviceSignature, devicePubkey)) {
    throw new Error('Invalid device signature');
  }

  // verify that the challenge was issued by this server
  const nonce = challengeBuffer.subarray(0, CHALLENGE_NONCE_LENGTH);
  const serverSignature = challengeBuffer.subarray(CHALLENGE_NONCE_LENGTH);
  if (serverSignature.length !== ED25519_SIGNATURE_LENGTH) {
    throw new Error('Invalid server signature length');
  }
  if (nonce.length !== CHALLENGE_NONCE_LENGTH) {
    throw new Error('Invalid challenge length');
  }
  if (!(await LocalSystemFact.verifySignature(nonce, serverSignature))) {
    throw new Error('Invalid server signature');
  }

  const device = await SyncDevice.findOrRegister(deviceId, user);

  // because the session ID is derived from the challenge, and we subsequently
  // insert sessions into the sync_sessions table, we guarantee that challenges
  // can't be reused without keeping track of challenges directly
  const sessionId = LocalSystemFact.newSessionId(nonce);

  return { device, sessionId };
}
