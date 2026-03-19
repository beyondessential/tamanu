import asyncHandler from 'express-async-handler';
import {
  FHIR_ISSUE_TYPE,
  FHIR_RESOURCE_TO_PERMISSION_NOUN,
  FHIR_INTEGRATION_PERMISSIONS,
  SERVICE_REQUEST_PERMISSION_NOUNS,
} from '@tamanu/constants';
import { FhirError } from '@tamanu/shared/utils/fhir';

class FhirForbiddenError extends FhirError {
  constructor(message) {
    super(message, {
      status: 403,
      code: FHIR_ISSUE_TYPE.SECURITY.FORBIDDEN,
    });
  }
}

function getPermissionNoun(fhirResourceName) {
  return FHIR_RESOURCE_TO_PERMISSION_NOUN[fhirResourceName];
}

function hasAnyServiceRequestReadPermission(ability) {
  return Object.values(SERVICE_REQUEST_PERMISSION_NOUNS).some(noun =>
    ability.can('read', noun),
  );
}

export function checkFhirReadPermission(FhirResource) {
  return asyncHandler(async (req, _res, next) => {
    const { ability } = req;

    if (FhirResource.fhirName === 'ServiceRequest') {
      if (!hasAnyServiceRequestReadPermission(ability)) {
        throw new FhirForbiddenError('No permission to read ServiceRequest');
      }
    } else {
      const noun = getPermissionNoun(FhirResource.fhirName);
      if (!noun || !ability.can('read', noun)) {
        throw new FhirForbiddenError(`No permission to read ${FhirResource.fhirName}`);
      }
    }

    next();
  });
}

export function checkFhirWritePermission(FhirResource) {
  return asyncHandler(async (req, _res, next) => {
    const { ability } = req;
    const noun = getPermissionNoun(FhirResource.fhirName);

    if (!noun || !ability.can('write', noun)) {
      throw new FhirForbiddenError(`No permission to write ${FhirResource.fhirName}`);
    }

    next();
  });
}

const ALL_WRITE_NOUNS = [
  ...new Set([
    ...Object.values(FHIR_RESOURCE_TO_PERMISSION_NOUN),
    ...Object.values(FHIR_INTEGRATION_PERMISSIONS).flatMap(c => c.write),
  ]),
];

export function checkFhirBundleWritePermission() {
  return asyncHandler(async (req, _res, next) => {
    const { ability } = req;
    const hasAnyWrite = ALL_WRITE_NOUNS.some(noun => ability.can('write', noun));
    if (!hasAnyWrite) {
      throw new FhirForbiddenError('No write permissions for any FHIR resource');
    }
    next();
  });
}

export function checkFhirWritePermissionForResource(ability, fhirResourceName) {
  const noun = getPermissionNoun(fhirResourceName);
  if (!noun || !ability.can('write', noun)) {
    throw new FhirForbiddenError(`No permission to write ${fhirResourceName}`);
  }
}
