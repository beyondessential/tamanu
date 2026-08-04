import { describe, expect, it } from 'vitest';
import {
  EditConflictError,
  ERROR_TYPE,
  ForbiddenError,
  NotFoundError,
  RemoteUnreachableError,
  ValidationError,
} from '@tamanu/errors';

import {
  API_ERROR_TOAST,
  classifyApiError,
  isErrorUnknownDefault,
} from '../../app/api/classifyApiError';

// The full taxonomy, so a newly added ERROR_TYPE has to be classified deliberately
// rather than falling through unnoticed (see the completeness test at the bottom).
const EXPECTED_BY_TYPE = {
  [ERROR_TYPE.AUTH]: null,
  [ERROR_TYPE.AUTH_CREDENTIAL_INVALID]: null,
  [ERROR_TYPE.AUTH_CREDENTIAL_MISSING]: null,
  [ERROR_TYPE.AUTH_PERMISSION_REQUIRED]: null,
  [ERROR_TYPE.AUTH_QUOTA_EXCEEDED]: null,
  [ERROR_TYPE.AUTH_TOKEN_INVALID]: null,
  [ERROR_TYPE.CLIENT_INCOMPATIBLE]: null,
  [ERROR_TYPE.FORBIDDEN]: null,
  [ERROR_TYPE.NOT_FOUND]: null,
  [ERROR_TYPE.RATE_LIMITED]: null,
  [ERROR_TYPE.VALIDATION]: null,
  [ERROR_TYPE.VALIDATION_CONSTRAINT]: null,
  [ERROR_TYPE.VALIDATION_DATABASE]: null,
  [ERROR_TYPE.VALIDATION_DUPLICATE]: null,
  [ERROR_TYPE.VALIDATION_OPERATION]: null,
  [ERROR_TYPE.VALIDATION_PARAMETER]: null,
  [ERROR_TYPE.VALIDATION_RELATION]: null,
  [ERROR_TYPE.REMOTE_UNREACHABLE]: API_ERROR_TOAST.UNREACHABLE,
  [ERROR_TYPE.EDIT_CONFLICT]: API_ERROR_TOAST.EDIT_CONFLICT,
  [ERROR_TYPE.DATABASE]: API_ERROR_TOAST.SERVER,
  [ERROR_TYPE.REMOTE]: API_ERROR_TOAST.SERVER,
  [ERROR_TYPE.REMOTE_INCOMPATIBLE]: API_ERROR_TOAST.SERVER,
  [ERROR_TYPE.STORAGE_INSUFFICIENT]: API_ERROR_TOAST.SERVER,
  [ERROR_TYPE.UNIMPLEMENTED]: API_ERROR_TOAST.SERVER,
  [ERROR_TYPE.UNKNOWN]: API_ERROR_TOAST.SERVER,
};

describe('classifyApiError', () => {
  it.each(Object.entries(EXPECTED_BY_TYPE))('classifies %s', (type, expected) => {
    expect(classifyApiError({ type })).toBe(expected);
  });

  it('shows the unreachable toast for a connectivity failure', () => {
    // The single most important case: a real failure to reach the server must be
    // distinguishable from the server responding with an error.
    expect(classifyApiError(new RemoteUnreachableError('Failed to fetch'))).toBe(
      API_ERROR_TOAST.UNREACHABLE,
    );
  });

  it('shows the conflict toast for a concurrent edit', () => {
    expect(classifyApiError(new EditConflictError())).toBe(API_ERROR_TOAST.EDIT_CONFLICT);
  });

  it('stays quiet for errors the caller handles itself', () => {
    expect(classifyApiError(new ValidationError('Date of birth is required'))).toBeNull();
    expect(classifyApiError(new NotFoundError())).toBeNull();
    expect(classifyApiError(new ForbiddenError())).toBeNull();
  });

  describe('errors with no usable type', () => {
    it.each([
      ['no type at all', {}],
      ['an undefined type', { type: undefined }],
      ['a null type', { type: null }],
      ['a non-string type', { type: 404 }],
      ['an unrecognised type', { type: 'nonsense' }],
      ['an unresolved problem URI', { type: '/problems/nonsense' }],
      ['a plain Error', new Error('boom')],
      ['no error object', undefined],
    ])('falls back to the server toast for %s', (_label, error) => {
      expect(classifyApiError(error)).toBe(API_ERROR_TOAST.SERVER);
    });
  });

  it('ignores the HTTP status', () => {
    // The old classifier keyed off status; a 404 or a 422 must stay quiet even
    // though its status is a client error, and a 200-status validation problem
    // must not become a toast.
    expect(classifyApiError({ type: ERROR_TYPE.NOT_FOUND, status: 404 })).toBeNull();
    expect(classifyApiError({ type: ERROR_TYPE.VALIDATION, status: 422 })).toBeNull();
    expect(classifyApiError({ type: ERROR_TYPE.REMOTE_UNREACHABLE, status: 200 })).toBe(
      API_ERROR_TOAST.UNREACHABLE,
    );
  });

  it('covers every error type in the taxonomy', () => {
    expect(Object.keys(EXPECTED_BY_TYPE).toSorted()).toEqual(
      Object.values(ERROR_TYPE).toSorted(),
    );
  });
});

describe('isErrorUnknownDefault', () => {
  it('is true only for the errors that raise a toast', () => {
    expect(isErrorUnknownDefault({ type: ERROR_TYPE.REMOTE_UNREACHABLE })).toBe(true);
    expect(isErrorUnknownDefault({ type: ERROR_TYPE.EDIT_CONFLICT })).toBe(true);
    expect(isErrorUnknownDefault({ type: ERROR_TYPE.DATABASE })).toBe(true);
    expect(isErrorUnknownDefault({})).toBe(true);

    expect(isErrorUnknownDefault({ type: ERROR_TYPE.FORBIDDEN })).toBe(false);
    expect(isErrorUnknownDefault({ type: ERROR_TYPE.NOT_FOUND })).toBe(false);
    expect(isErrorUnknownDefault({ type: ERROR_TYPE.VALIDATION })).toBe(false);
    expect(isErrorUnknownDefault({ type: ERROR_TYPE.RATE_LIMITED })).toBe(false);
    expect(isErrorUnknownDefault({ type: ERROR_TYPE.AUTH_TOKEN_INVALID })).toBe(false);
  });
});
