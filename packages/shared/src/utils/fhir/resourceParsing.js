import { Invalid } from './errors';
import { FHIR_ISSUE_TYPE } from '@tamanu/constants';

export function parseBasedOn(basedOn, supportedTypes = []) {
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

  if (type && type !==  ref[0]) {
    throw new Invalid('mismatch between basedOn type and reference type', {
      code: FHIR_ISSUE_TYPE.INVALID.VALUE,
    });
  }
  return ref[1];
}
