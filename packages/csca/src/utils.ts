export function enumFromStringValue<T>(enm: { [s: string]: T }, value: string): T {
  if (!((Object.values(enm) as unknown) as string[]).includes(value)) {
    throw new Error(`Invalid value: ${value}`);
  }

  return (value as unknown) as T;
}

export function enumValues<T>(enm: { [s: string]: T }): T[] {
  return Object.values(enm) as T[];
}

// https://www.rfc-editor.org/rfc/rfc7518#section-6.2
export async function keyPairFromPrivate(privateKey: CryptoKey): Promise<CryptoKeyPair> {
  const { alg, crv, ext, key_ops, kty, x, y } = await crypto.subtle.exportKey('jwk', privateKey);
  const publicKey = await crypto.subtle.importKey(
    'jwk',
    { alg, crv, ext, key_ops, kty, x, y },
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify'],
  );

  return { publicKey, privateKey };
}
