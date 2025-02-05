export async function signChallenge({ challenge, models: { LocalSystemFact } }) {
  const challengeBytes = Buffer.from(challenge, 'base64');
  const signed = await LocalSystemFact.sign(challengeBytes);
  return signed;
}
