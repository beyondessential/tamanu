import { v5 as uuidv5 } from 'uuid';

import { FHIR_RESOURCE_ID_NAMESPACE } from '@tamanu/constants';

/**
 * The deterministic id for a materialised FHIR resource: a name-based UUID (version 5,
 * RFC 4122) derived from the frozen Tamanu FHIR namespace and the name
 * `<fhirResourceType>/<upstreamId>`. The same resource type and upstream id always
 * produce the same id, so a given upstream record resolves to the same FHIR resource id
 * on every server and across deployments.
 *
 * The namespace, the name format, and the UUID version are a frozen contract: external
 * systems recompute a resource's id from them, so changing any of the three would change
 * every derived id. See specs/fhir/resource-ids.md.
 */
// spec: FRID
export const fhirResourceId = (fhirResourceType: string, upstreamId: string): string =>
  uuidv5(`${fhirResourceType}/${upstreamId}`, FHIR_RESOURCE_ID_NAMESPACE);
