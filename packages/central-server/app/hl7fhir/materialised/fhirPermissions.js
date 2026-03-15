import asyncHandler from 'express-async-handler';
import {
  FHIR_ISSUE_TYPE,
  FHIR_RESOURCE_TO_PERMISSION_NOUN,
  SERVICE_REQUEST_PERMISSION_NOUNS,
  SERVICE_REQUEST_CATEGORY_CODES,
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

function getServiceRequestAllowedCategories(ability) {
  const categories = [];
  if (ability.can('read', SERVICE_REQUEST_PERMISSION_NOUNS.LAB)) {
    categories.push(SERVICE_REQUEST_CATEGORY_CODES.LAB);
  }
  if (ability.can('read', SERVICE_REQUEST_PERMISSION_NOUNS.IMAGING)) {
    categories.push(SERVICE_REQUEST_CATEGORY_CODES.IMAGING);
  }
  return categories;
}

export function checkFhirReadPermission(FhirResource) {
  return asyncHandler(async (req, _res, next) => {
    const { ability } = req;

    if (FhirResource.fhirName === 'ServiceRequest') {
      const allowedCategories = getServiceRequestAllowedCategories(ability);
      if (allowedCategories.length === 0) {
        throw new FhirForbiddenError('No permission to read ServiceRequest');
      }
      req.fhirAllowedServiceRequestCategories = allowedCategories;
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

export function checkFhirWritePermissionForResource(ability, fhirResourceName) {
  const noun = getPermissionNoun(fhirResourceName);
  if (!noun || !ability.can('write', noun)) {
    throw new FhirForbiddenError(`No permission to write ${fhirResourceName}`);
  }
}

export function checkServiceRequestRecordAccess(ability, record) {
  const allowedCategories = getServiceRequestAllowedCategories(ability);
  if (allowedCategories.length === 0) {
    throw new FhirForbiddenError('No permission to read ServiceRequest');
  }

  const recordCategories = record.category ?? [];
  const recordCodes = recordCategories.flatMap(cat =>
    (cat.coding ?? []).map(coding => coding.code),
  );

  const hasAccess = recordCodes.some(code => allowedCategories.includes(code));
  if (!hasAccess) {
    throw new FhirForbiddenError('No permission to read this ServiceRequest');
  }
}
