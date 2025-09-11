import {
  VERSION_COMPATIBILITY_ERRORS,
  VERSION_MINIMUM_PROBLEM_KEY,
  VERSION_MAXIMUM_PROBLEM_KEY,
} from '@tamanu/constants';
import {
  BadAuthenticationError,
  BaseError,
  ClientIncompatibleError,
  EditConflictError,
  ERROR_TYPE,
  ForbiddenError,
  NotFoundError,
  Problem,
  RemoteUnreachableError,
  UnknownError,
  ValidationError,
} from '@tamanu/errors';

export function isRecoverable(error) {
  if (!(error instanceof BaseError)) {
    return false;
  }

  if (error instanceof RemoteUnreachableError || error.type === ERROR_TYPE.RATE_LIMITED) {
    return true;
  }

  if (
    [
      ERROR_TYPE.AUTH_CREDENTIAL_INVALID,
      ERROR_TYPE.AUTH_CREDENTIAL_MISSING,
      ERROR_TYPE.CLIENT_INCOMPATIBLE,
      ERROR_TYPE.STORAGE_INSUFFICIENT,
    ].includes(error.type)
  ) {
    return false;
  }

  if (error.status >= 400 && error.status < 500) {
    return false;
  }

  if (error.detail?.includes('Sync session')) {
    return false;
  }

  return true;
}

const VERSION_COMPAT_MESSAGE_LOW =
  'Tamanu is out of date, reload to get the new version! If that does not work, contact your system administrator.';
const VERSION_COMPAT_MESSAGE_HIGH = maxAppVersion =>
  `The Tamanu Facility Server only supports up to v${maxAppVersion}, and needs to be upgraded. Please contact your system administrator.`;

/**
 * @internal
 * @param {Problem} problem
 */
export function getVersionIncompatibleMessage(problem) {
  if (problem.detail === VERSION_COMPATIBILITY_ERRORS.LOW) {
    return VERSION_COMPAT_MESSAGE_LOW;
  }

  if (problem.detail === VERSION_COMPATIBILITY_ERRORS.HIGH) {
    const maxAppVersion = problem.extra.get(VERSION_MAXIMUM_PROBLEM_KEY);
    return VERSION_COMPAT_MESSAGE_HIGH(maxAppVersion);
  }

  return null;
}

function convertLegacyError(error, response) {
  let legacyMessage = error?.message || response.status.toString();
  let ErrorClass;
  switch (error?.status ?? response.status) {
    case 400: {
      ErrorClass = UnknownError;
      if (
        response.headers.has('x-max-client-version') ||
        response.headers.has('x-min-client-version')
      ) {
        ErrorClass = ClientIncompatibleError;
      } else if (error.name) {
        ErrorClass.name = error.name;
      }
      break;
    }
    case 401: {
      legacyMessage = error?.message || 'Failed authentication';
      ErrorClass = BadAuthenticationError;
      break;
    }
    case 403:
      ErrorClass = ForbiddenError;
      break;
    case 404:
      ErrorClass = NotFoundError;
      break;
    case 409:
      ErrorClass = EditConflictError;
      break;
    default:
      ErrorClass = UnknownError;
      if (error.name) {
        ErrorClass.name = error.name;
      }
  }

  const problem = Problem.fromError(new ErrorClass(legacyMessage));
  if (error.name) {
    problem.title = problem.name = error.name;
    problem.message = legacyMessage;
  }

  problem.extra.set('legacy-error', error);

  if (problem.type === ERROR_TYPE.CLIENT_INCOMPATIBLE) {
    const minAppVersion = response.headers.get('X-Min-Client-Version');
    if (minAppVersion) problem.extra.set(VERSION_MINIMUM_PROBLEM_KEY, minAppVersion);

    const maxAppVersion = response.headers.get('X-Max-Client-Version');
    if (maxAppVersion) problem.extra.set(VERSION_MAXIMUM_PROBLEM_KEY, maxAppVersion);
  }

  return problem;
}

async function readResponse(response, logger = console) {
  let data;
  try {
    data = await response.text();
  } catch (err) {
    logger.warn('readResponseError: Error decoding text', err);
    return new ValidationError('Invalid text encoding in response').withCause(err);
  }

  if (data.length === 0) {
    return new Problem(ERROR_TYPE.REMOTE, 'Server error', response.status, 'No response data');
  }

  let json;
  try {
    json = JSON.parse(data);
  } catch (err) {
    logger.warn('readResponseError: Error parsing JSON', err);
    return new ValidationError('Invalid JSON in response').withCause(err);
  }

  if (json.error) {
    return convertLegacyError(json.error, response);
  }

  const problem = Problem.fromJSON(json);
  if (problem) return problem;

  const unk = new Problem(
    ERROR_TYPE.REMOTE,
    'Server error',
    response.status,
    'Unknown response format',
  );
  unk.extra.set('response-data', json);
  return unk;
}

function messageField(problem) {
  if (!problem.detail) {
    return problem.title;
  }

  if (problem.detail === problem.title) {
    return problem.detail;
  }

  return `${problem.title}: ${problem.detail}`;
}

export async function extractErrorFromFetchResponse(response, url, logger = console) {
  const problem = await readResponse(response, logger);
  problem.extra.set('request-url', url);
  problem.response = response;
  problem.message = messageField(problem);
}
