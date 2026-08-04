import { describe, expect, it, vi } from 'vitest';
import {
  EditConflictError,
  ERROR_TYPE,
  extractErrorFromFetchResponse,
  ForbiddenError,
  NotFoundError,
  Problem,
  RemoteUnreachableError,
  ValidationError,
} from '@tamanu/errors';

import {
  API_ERROR_TOAST,
  classifyApiError,
  isErrorUnknownDefault,
  resolveApiErrorToast,
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
    expect(Object.keys(EXPECTED_BY_TYPE).toSorted()).toEqual(Object.values(ERROR_TYPE).toSorted());
  });
});

// The classifier sees whatever @tamanu/errors made of the response, so go through
// the real extraction rather than hand-built error objects: an error body that
// isn't a problem document at all is the case most likely to be misfiled.
describe('errors extracted from a real response', () => {
  const silentLogger = {
    debug: () => {},
    error: () => {},
    info: () => {},
    log: () => {},
    warn: () => {},
  };

  const extract = response =>
    extractErrorFromFetchResponse(response, 'patient/all-of-them', silentLogger);

  const htmlErrorPage = status =>
    new Response(`<!doctype html><title>${status}</title><h1>${status}</h1>`, {
      status,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });

  it.each([502, 504, 500])(
    'raises the server toast for a proxy-generated HTML %i page',
    async status => {
      // Caddy serves its own HTML error page for these, so the body never parses
      // as a problem document. A gateway failure is the exact thing this toast
      // exists to surface, so it must not be mistaken for a validation error the
      // form it came from will report.
      const problem = await extract(htmlErrorPage(status));

      expect(problem.type).toBe(ERROR_TYPE.REMOTE);
      expect(problem.status).toBe(status);
      expect(classifyApiError(problem)).toBe(API_ERROR_TOAST.SERVER);
    },
  );

  it('raises the server toast for an empty error body', async () => {
    const problem = await extract(new Response('', { status: 502 }));

    expect(classifyApiError(problem)).toBe(API_ERROR_TOAST.SERVER);
  });

  it('stays quiet for a validation problem the server really authored', async () => {
    // The other half of the deliberate decision: a genuine validation problem
    // belongs to the form that submitted it, so no global toast.
    const problem = await extract(
      Problem.fromError(new ValidationError('Date of birth is required')).intoResponse(),
    );

    expect(problem.type).toBe(ERROR_TYPE.VALIDATION);
    expect(classifyApiError(problem)).toBeNull();
  });

  it('raises the unreachable toast when the server responds with one', async () => {
    const problem = await extract(Problem.fromError(new RemoteUnreachableError()).intoResponse());

    expect(classifyApiError(problem)).toBe(API_ERROR_TOAST.UNREACHABLE);
  });
});

describe('resolveApiErrorToast', () => {
  describe('with no caller-supplied predicate', () => {
    it.each(Object.entries(EXPECTED_BY_TYPE))('lets the classifier decide %s', (type, expected) => {
      expect(resolveApiErrorToast({ type })).toBe(expected);
    });

    it('falls back to the server toast for an unrecognised error', () => {
      expect(resolveApiErrorToast(new Error('boom'))).toBe(API_ERROR_TOAST.SERVER);
    });
  });

  describe('with a caller-supplied predicate', () => {
    it('raises the server toast for an error the classifier is quiet about', () => {
      // The predicate is how a caller forces a toast the classifier wouldn't
      // raise; the toast must have real copy rather than being empty.
      expect(resolveApiErrorToast({ type: ERROR_TYPE.NOT_FOUND }, () => true)).toBe(
        API_ERROR_TOAST.SERVER,
      );
      expect(resolveApiErrorToast({ type: ERROR_TYPE.VALIDATION }, () => true)).toBe(
        API_ERROR_TOAST.SERVER,
      );
    });

    it('keeps the specific toast kind when the classifier already picked one', () => {
      expect(resolveApiErrorToast({ type: ERROR_TYPE.REMOTE_UNREACHABLE }, () => true)).toBe(
        API_ERROR_TOAST.UNREACHABLE,
      );
      expect(resolveApiErrorToast({ type: ERROR_TYPE.EDIT_CONFLICT }, () => true)).toBe(
        API_ERROR_TOAST.EDIT_CONFLICT,
      );
    });

    it('suppresses a toast the classifier would have raised', () => {
      expect(resolveApiErrorToast({ type: ERROR_TYPE.REMOTE_UNREACHABLE }, () => false)).toBeNull();
      expect(resolveApiErrorToast(new Error('boom'), () => false)).toBeNull();
    });

    it('consults the predicate exactly once, with the error', () => {
      const error = new RemoteUnreachableError('Failed to fetch');
      const isErrorUnknown = vi.fn(() => false);
      resolveApiErrorToast(error, isErrorUnknown);
      expect(isErrorUnknown).toHaveBeenCalledTimes(1);
      expect(isErrorUnknown).toHaveBeenCalledWith(error);
    });
  });

  it('agrees with the default predicate on whether to toast at all', () => {
    // isErrorUnknownDefault is no longer on the default path, so pin the two
    // together: anything it calls unknown must still produce a toast.
    for (const type of Object.keys(EXPECTED_BY_TYPE)) {
      expect(resolveApiErrorToast({ type }) !== null).toBe(isErrorUnknownDefault({ type }));
    }
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
