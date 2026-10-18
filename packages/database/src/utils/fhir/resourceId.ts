import { createHash } from 'node:crypto';

import { FHIR_RESOURCE_ID_NAMESPACE } from '@tamanu/constants';

const uuidToBytes = (uuid: string): Buffer => {
  const hex = uuid.replace(/-/g, '');
  if (hex.length !== 32 || /[^0-9a-f]/i.test(hex)) {
    throw new Error(`Invalid UUID: ${uuid}`);
  }
  return Buffer.from(hex, 'hex');
};

const bytesToUuid = (bytes: Buffer): string => {
  const hex = bytes.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
};

// Name-based UUID (version 5, RFC 4122): SHA-1 of the namespace bytes followed by the
// name, with the version and variant bits set so the result is a valid UUID.
export const uuidv5 = (name: string, namespace: string): string => {
  const hash = createHash('sha1').update(uuidToBytes(namespace)).update(name, 'utf8').digest();
  const bytes = hash.subarray(0, 16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // RFC 4122 variant
  return bytesToUuid(bytes);
};

/**
 * The deterministic id for a materialised FHIR resource: a UUIDv5 derived from the
 * frozen Tamanu FHIR namespace and the name `<fhirResourceType>/<upstreamId>`. The same
 * resource type and upstream id always produce the same id, so a given upstream record
 * resolves to the same FHIR resource id on every server and across deployments.
 */
// spec: FRID
export const fhirResourceId = (fhirResourceType: string, upstreamId: string): string =>
  uuidv5(`${fhirResourceType}/${upstreamId}`, FHIR_RESOURCE_ID_NAMESPACE);
