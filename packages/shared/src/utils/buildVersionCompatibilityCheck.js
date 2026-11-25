import semver from 'semver';
import {
  SERVER_TYPES,
  VERSION_COMPATIBILITY_ERRORS,
  VERSION_MAXIMUM_PROBLEM_KEY,
  VERSION_MINIMUM_PROBLEM_KEY,
} from '@tamanu/constants';
import { ClientIncompatibleError } from '@tamanu/errors';
import { log } from '../services/logging';

function isMobileClient(req) {
  return (req.header('X-Tamanu-Client') || '').includes(SERVER_TYPES.MOBILE);
}

function getUpdateInformation(req, minVersion, updateUrls) {
  if (!updateUrls?.mobile) return {};

  if (isMobileClient(req)) {
    return {
      updateUrl: updateUrls.mobile.replaceAll('{minVersion}', minVersion),
    };
  }

  return {};
}

// The first mobile release that can download and install its own update. Earlier apps only offer
// the update link from the alert shown when login is refused, so they must still be refused there.
const FIRST_SELF_UPDATING_MOBILE_VERSION = '2.70.0';

/**
 * An out-of-date mobile app updates itself while staff keep working offline, so turning it away at
 * login would strand anyone who signed out mid-update. It is let in to log in and told to update by
 * the next sync instead. Other clients, and mobile apps too old to update themselves, are still
 * turned away at login, where they can be told plainly rather than failing every call afterwards.
 */
function isExemptFromMinimumVersion(req, clientVersion) {
  return (
    isMobileClient(req) &&
    (req.path ?? '').endsWith('/login') &&
    semver.compare(clientVersion, FIRST_SELF_UPDATING_MOBILE_VERSION) >= 0
  );
}

export const buildVersionCompatibilityCheck = (min, max, updateUrls) => (req, res, next) => {
  // include the min/max supported clients with any response
  if (min) {
    res.setHeader('X-Min-Client-Version', min);
  }
  if (max) {
    res.setHeader('X-Max-Client-Version', max);
  }

  // check the connecting client is supported, and respond with an error if not
  const clientVersion = req.header('X-Version');
  if (!clientVersion) {
    // a thirdparty tool (or internal test suite) is using the API; ignore version checking
    next();
    return;
  }

  if (
    min &&
    semver.compare(clientVersion, min) < 0 &&
    !isExemptFromMinimumVersion(req, clientVersion)
  ) {
    throw new ClientIncompatibleError(VERSION_COMPATIBILITY_ERRORS.LOW).withExtraData({
      ...getUpdateInformation(req, min, updateUrls),
      [VERSION_MINIMUM_PROBLEM_KEY]: min,
      [VERSION_MAXIMUM_PROBLEM_KEY]: max,
    });
  }

  if (max && semver.compare(clientVersion, max) > 0) {
    if (semver.diff(max, clientVersion) === 'patch') {
      log.error(
        `Allowing client v${clientVersion} with higher patch than max supported v${max} to connect`,
      );
      next();
      return;
    }

    throw new ClientIncompatibleError(VERSION_COMPATIBILITY_ERRORS.HIGH).withExtraData({
      [VERSION_MINIMUM_PROBLEM_KEY]: min,
      [VERSION_MAXIMUM_PROBLEM_KEY]: max,
    });
  }
  next();
};
