import { Invalid } from './errors';
import { FHIR_ISSUE_TYPE } from '@tamanu/constants';

function parseBasedOn(basedOn, supportedTypes = []) {
  const { type, reference } = basedOn;

  const ref = reference.split('/');
  if (
    (type && !supportedTypes.includes(type)) ||
    ref.length < 2 ||
    !supportedTypes.includes(ref[0])) {
    throw new Invalid(`basedOn supports only ${supportedTypes.join(',')}`, {
      code: FHIR_ISSUE_TYPE.INVALID.VALUE,
    });
  }

  if (type && type !== ref[0]) {
    throw new Invalid('mismatch between basedOn type and reference type', {
      code: FHIR_ISSUE_TYPE.INVALID.VALUE,
    });
  }
  return ref[1];
}
export async function getLabRequestFromBasedOn(basedOn, models, supportedTypes = []) {
  const { FhirServiceRequest, LabRequest } = models;
  if (!basedOn || !Array.isArray(basedOn)) {
    throw new Invalid('DiagnosticReport requires basedOn to report results for ServiceRequest', {
      code: FHIR_ISSUE_TYPE.INVALID.VALUE,
    });
  }
  const serviceRequestFhirId = parseBasedOn(basedOn[0], supportedTypes);

  const serviceRequest = await FhirServiceRequest.findOne({ where: { id: serviceRequestFhirId } });

  if (!serviceRequest) {
    throw new Invalid(`ServiceRequest '${serviceRequestFhirId}' does not exist in Tamanu`, {
      code: FHIR_ISSUE_TYPE.INVALID.VALUE,
    });
  }

  return await LabRequest.findByPk(serviceRequest.upstreamId);
}