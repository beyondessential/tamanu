import { VERSION_MINIMUM_PROBLEM_KEY, VERSION_MAXIMUM_PROBLEM_KEY } from '@tamanu/constants';
import { BaseError } from './BaseError';
import { ERROR_TYPE, type ErrorType } from './constants';
import { Problem } from './Problem';
import {
  BadAuthenticationError,
  ClientIncompatibleError,
  EditConflictError,
  ForbiddenError,
  NotFoundError,
  RemoteUnreachableError,
  UnknownError,
  ValidationError,
} from './errors';

export function isRecoverable(error: Error) {
  if (!(error instanceof BaseError)) {
    return false;
  }

  if (error instanceof RemoteUnreachableError || error.type === ERROR_TYPE.RATE_LIMITED) {
    return true;
  }

  if (
    (
      [
        ERROR_TYPE.AUTH_CREDENTIAL_INVALID,
        ERROR_TYPE.AUTH_CREDENTIAL_MISSING,
        ERROR_TYPE.CLIENT_INCOMPATIBLE,
        ERROR_TYPE.STORAGE_INSUFFICIENT,
      ] as ErrorType[]
    ).includes(error.type)
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

interface LegacyError {
  name?: string;
  message?: string;
  status?: number;
}

function convertLegacyError(error: LegacyError, response: Response): Problem {
  let legacyMessage = error?.message || response.status.toString();
  let errorName: undefined | string;
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
        errorName = error.name;
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
        errorName = error.name;
      }
  }

  const problem = Problem.fromError(new ErrorClass(legacyMessage));
  if (error.name || errorName) {
    // ! -> we know from the condition that at least one of error.name or errorName is defined
    problem.title = errorName ?? error.name!;
    problem.message = legacyMessage;
  }

  problem.extra.set('legacy-error', error);

  if (problem.type === ERROR_TYPE.CLIENT_INCOMPATIBLE) {
    const minAppVersion = response.headers.get('x-min-client-version');
    if (minAppVersion) problem.extra.set(VERSION_MINIMUM_PROBLEM_KEY, minAppVersion);

    const maxAppVersion = response.headers.get('x-max-client-version');
    if (maxAppVersion) problem.extra.set(VERSION_MAXIMUM_PROBLEM_KEY, maxAppVersion);
  }

  return problem;
}

interface Logger {
  debug: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  log: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
}

async function readResponse(response: Response, logger: Logger = console): Promise<Problem> {
  let data;
  try {
    data = await response.text();
  } catch (err) {
    logger.warn('readResponseError: Error decoding text', err);
    return Problem.fromError(
      new ValidationError('Invalid text encoding in response').withCause(err as Error),
    );
  }

  if (data.length === 0) {
    return new Problem(ERROR_TYPE.REMOTE, 'Server error', response.status, 'No response data');
  }

  let json;
  try {
    json = JSON.parse(data);
  } catch (err) {
    logger.warn('readResponseError: Error parsing JSON', err);
    return Problem.fromError(
      new ValidationError('Invalid JSON in response').withCause(err as Error),
    );
  }

  const problem = Problem.fromJSON(json);
  if (problem) {
    return problem;
  }
  if (json.error) {
    return convertLegacyError(json.error, response);
  }

  const unk = new Problem(
    ERROR_TYPE.REMOTE,
    'Server error',
    response.status,
    'Unknown response format',
  );
  unk.extra.set('response-data', json);
  return unk;
}

function messageField(problem: Problem): string {
  if (!problem.detail) {
    return problem.title;
  }

  if (problem.detail === problem.title) {
    return problem.detail;
  }

  return `${problem.title}: ${problem.detail}`;
}

export async function extractErrorFromFetchResponse(
  response: Response,
  url: string,
  logger: Logger = console,
): Promise<Problem> {
  const problem = await readResponse(response, logger);
  problem.extra.set('request-url', url);
  problem.response = response;
  problem.message = messageField(problem);
  return problem;
}
