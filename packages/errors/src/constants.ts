export const ERROR_TYPE = {
  AUTH: 'auth',
  AUTH_CREDENTIAL_INVALID: 'auth-credential-invalid',
  AUTH_CREDENTIAL_MISSING: 'auth-credential-missing',
  AUTH_PERMISSION_REQUIRED: 'auth-permission-required',
  AUTH_QUOTA_EXCEEDED: 'auth-quota-exceeded',
  AUTH_TOKEN_INVALID: 'auth-token-invalid',
  CLIENT_INCOMPATIBLE: 'client-incompatible',
  DATABASE: 'database',
  EDIT_CONFLICT: 'conflict',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'not-found',
  RATE_LIMITED: 'rate-limited',
  REMOTE: 'remote',
  REMOTE_INCOMPATIBLE: 'remote-incompatible',
  REMOTE_UNREACHABLE: 'remote-unreachable',
  STORAGE_INSUFFICIENT: 'storage-insufficient',
  UNKNOWN: 'unknown',
  UNIMPLEMENTED: 'unimplemented',
  VALIDATION: 'validation',
  VALIDATION_CONSTRAINT: 'validation-constraint',
  VALIDATION_DATABASE: 'validation-database',
  VALIDATION_DUPLICATE: 'validation-duplicate',
  VALIDATION_OPERATION: 'validation-operation',
  VALIDATION_PARAMETER: 'validation-parameter',
  VALIDATION_RELATION: 'validation-relation',
} as const;
export type ErrorType = (typeof ERROR_TYPE)[keyof typeof ERROR_TYPE];

// Problem types defined at the IANA registry
// https://iana.org/assignments/http-problem-types
export const IANA_TYPES: ErrorType[] = [];

/** @internal used only within this package */
export function isKnownErrorType(type: string): type is ErrorType {
  return Object.values(ERROR_TYPE).includes(type as ErrorType);
}

/** @internal used only within this package */
export const WELL_KNOWN_PROBLEM_KEYS = ['type', 'title', 'status', 'detail', 'instance'];
