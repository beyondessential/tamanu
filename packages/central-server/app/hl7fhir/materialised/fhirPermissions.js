import asyncHandler from 'express-async-handler';
import {
  FHIR_ISSUE_TYPE,
  FHIR_RESOURCE_TO_PERMISSION_NOUN,
  FHIR_INTEGRATION_PERMISSIONS,
  FHIR_INTEGRATION_VERB,
  SERVICE_REQUEST_PERMISSION_NOUNS,
  SERVICE_REQUEST_CATEGORY_CODES,
} from '@tamanu/constants';
import { FhirError, NotFound } from '@tamanu/shared/utils/fhir';

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

export function hasFhirPermission(ability, verb, noun) {
  if (ability.can(verb, noun)) return true;

  for (const [type, config] of Object.entries(FHIR_INTEGRATION_PERMISSIONS)) {
    const hasFullAccess = ability.can(FHIR_INTEGRATION_VERB, type);
    const hasVerbAccess = ability.can(verb, type);
    if (!hasFullAccess && !hasVerbAccess) continue;
    if (verb === 'read' && config.read.includes(noun)) return true;
    if (verb === 'write' && config.write.includes(noun)) return true;
  }
  return false;
}

function getServiceRequestAllowedCategories(ability) {
  const categories = [];
  if (hasFhirPermission(ability, 'read', SERVICE_REQUEST_PERMISSION_NOUNS.LAB)) {
    categories.push(SERVICE_REQUEST_CATEGORY_CODES.LAB);
  }
  if (hasFhirPermission(ability, 'read', SERVICE_REQUEST_PERMISSION_NOUNS.IMAGING)) {
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
      if (!noun || !hasFhirPermission(ability, 'read', noun)) {
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

    if (!noun || !hasFhirPermission(ability, 'write', noun)) {
      throw new FhirForbiddenError(`No permission to write ${FhirResource.fhirName}`);
    }

    next();
  });
}

export function checkFhirBundleWritePermission() {
  return asyncHandler(async (req, _res, next) => {
    const { ability } = req;
    const hasAnyWrite = Object.values(FHIR_RESOURCE_TO_PERMISSION_NOUN).some(noun =>
      hasFhirPermission(ability, 'write', noun),
    );
    if (!hasAnyWrite) {
      throw new FhirForbiddenError('No write permissions for any FHIR resource');
    }
    next();
  });
}

export function checkFhirWritePermissionForResource(ability, fhirResourceName) {
  const noun = getPermissionNoun(fhirResourceName);
  if (!noun || !hasFhirPermission(ability, 'write', noun)) {
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
    throw new NotFound(`no ServiceRequest with id ${record.id}`);
  }
}
