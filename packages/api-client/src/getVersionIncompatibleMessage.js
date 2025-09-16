import { VERSION_COMPATIBILITY_ERRORS, VERSION_MAXIMUM_PROBLEM_KEY } from '@tamanu/constants';

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
