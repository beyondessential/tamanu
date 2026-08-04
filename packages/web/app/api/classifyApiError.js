import { ERROR_TYPE } from '@tamanu/errors';

/**
 * The toasts an API error can raise. Each one has its own copy, chosen so the
 * user can tell a connectivity problem apart from a server problem.
 */
export const API_ERROR_TOAST = {
  /** The server could not be reached at all. */
  UNREACHABLE: 'unreachable',
  /** Someone else changed the record between reading and saving it. */
  EDIT_CONFLICT: 'edit-conflict',
  /** Anything else the user cannot act on themselves. */
  SERVER: 'server',
};

// `isKnownErrorType` in @tamanu/errors is marked @internal and isn't re-exported
// from the package entry point, so recognise the types locally instead.
const KNOWN_ERROR_TYPES = new Set(Object.values(ERROR_TYPE));

// Error types that are already dealt with somewhere more specific, so a global
// toast would be noise or a duplicate:
//
// - `auth*` logs the session out and shows a message on the login screen
// - `forbidden` and `rate-limited` are surfaced by the view that hit them
// - `validation*` belongs to the form that submitted the request
// - `not-found` is a normal outcome for the many optional-resource queries
// - `client-incompatible` already triggers the version-incompatible logout
//   message from @tamanu/api-client (see `getVersionIncompatibleMessage`)
const SILENT_ERROR_TYPES = new Set([
  ERROR_TYPE.CLIENT_INCOMPATIBLE,
  ERROR_TYPE.FORBIDDEN,
  ERROR_TYPE.NOT_FOUND,
  ERROR_TYPE.RATE_LIMITED,
  ERROR_TYPE.VALIDATION,
  ERROR_TYPE.VALIDATION_CONSTRAINT,
  ERROR_TYPE.VALIDATION_DATABASE,
  ERROR_TYPE.VALIDATION_DUPLICATE,
  ERROR_TYPE.VALIDATION_OPERATION,
  ERROR_TYPE.VALIDATION_PARAMETER,
  ERROR_TYPE.VALIDATION_RELATION,
]);

/**
 * Decides which toast (if any) an API error should raise, based on its
 * `ERROR_TYPE`. An error with a missing or unrecognised type is treated as a
 * server error, so nothing gets silently swallowed.
 *
 * @returns {string | null} a value of `API_ERROR_TOAST`, or null for no toast.
 */
export function classifyApiError(error) {
  const type = error?.type;

  if (typeof type !== 'string' || !KNOWN_ERROR_TYPES.has(type)) {
    return API_ERROR_TOAST.SERVER;
  }

  if (type.startsWith(ERROR_TYPE.AUTH) || SILENT_ERROR_TYPES.has(type)) {
    return null;
  }

  if (type === ERROR_TYPE.REMOTE_UNREACHABLE) {
    return API_ERROR_TOAST.UNREACHABLE;
  }

  if (type === ERROR_TYPE.EDIT_CONFLICT) {
    return API_ERROR_TOAST.EDIT_CONFLICT;
  }

  return API_ERROR_TOAST.SERVER;
}

/**
 * The toast an API error should raise, honouring a caller-supplied
 * `isErrorUnknown` predicate.
 *
 * Without a predicate — the usual case — the classifier decides on its own. A
 * predicate overrides it in both directions: it can force a toast for an error
 * the classifier stays quiet about (shown as a server error), or suppress one
 * the classifier would have raised.
 *
 * @returns {string | null} a value of `API_ERROR_TOAST`, or null for no toast.
 */
export function resolveApiErrorToast(error, isErrorUnknown) {
  const toastKind = classifyApiError(error);

  if (!isErrorUnknown) {
    return toastKind;
  }

  return isErrorUnknown(error) ? (toastKind ?? API_ERROR_TOAST.SERVER) : null;
}

/**
 * The predicate `resolveApiErrorToast` applies when a caller doesn't supply one.
 * `TamanuApi.fetch` doesn't route the default path through it (the classifier
 * result is enough), but it stays exported for callers that need to compose or
 * wrap the default behaviour — it's re-exported from `web/app/api`.
 */
export function isErrorUnknownDefault(error) {
  return classifyApiError(error) !== null;
}
