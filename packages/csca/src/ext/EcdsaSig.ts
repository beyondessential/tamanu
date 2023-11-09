import {
  AsnConvert,
  AsnIntegerArrayBufferConverter,
  AsnParser,
  AsnProp,
  AsnPropTypes,
  AsnType,
  AsnTypeTypes,
} from '@peculiar/asn1-schema';

/**
 * ```
 * EcdsaSignature ::= SEQUENCE {
 *     r Integer,
 *     s Integer }
 * ```
 */
@AsnType({ type: AsnTypeTypes.Sequence })
class EcdsaSignature {
  @AsnProp({ type: AsnPropTypes.Integer, converter: AsnIntegerArrayBufferConverter })
  public r = new ArrayBuffer(0);

  @AsnProp({ type: AsnPropTypes.Integer, converter: AsnIntegerArrayBufferConverter })
  public s = new ArrayBuffer(0);
}

function extractSigPart(websig: ArrayBuffer, start: number, length: number): ArrayBuffer {
  const buffer = new ArrayBuffer(length);
  const view = new Uint8Array(buffer);
  view.set(new Uint8Array(websig, start, length));
  return buffer;
}

/**
 * Create a BER-style ECDSA signature from a WebCrypto ECDSA signature.
 */
export function ecdsaWebSigToBER(websig: ArrayBuffer): ArrayBuffer {
  if (websig.byteLength % 2 !== 0) throw new Error('Invalid websig length');

  // Split websig into two, for the r and s values
  const length = websig.byteLength / 2;
  const r = extractSigPart(websig, 0, length);
  const s = extractSigPart(websig, length, length);

  const sig = new EcdsaSignature();
  Object.assign(sig, { r, s });

  return AsnConvert.serialize(sig);
}

/**
 * Extract a WebCrypto-style ECDSA signature from a BER-style one.
 */
export function ecdsaBERToWebSig(bersig: ArrayBuffer): ArrayBuffer {
  const sig = AsnParser.parse(bersig, EcdsaSignature);
  return Buffer.concat([new Uint8Array(sig.r), new Uint8Array(sig.s)]);
}
