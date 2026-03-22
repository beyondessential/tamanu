import compareVersions from 'semver-compare';
import semverDiff from 'semver-diff';
import config from 'config';
import {
  VERSION_COMPATIBILITY_ERRORS,
  VERSION_MAXIMUM_PROBLEM_KEY,
  VERSION_MINIMUM_PROBLEM_KEY,
} from '@tamanu/constants';
import { ClientIncompatibleError } from '@tamanu/errors';
import { log } from '../services/logging';

function getUpdateInformation(req, minVersion) {
  if (!config.updateUrls) return {};

  const clientType = req.header('X-Tamanu-Client') || '';
  if (clientType.includes('Tamanu Mobile')) {
    return {
      updateUrl: config.updateUrls.mobile.replaceAll('{minVersion}', minVersion),
    };
  }

  return {};
}

export const buildVersionCompatibilityCheck = (min, max) => (req, res, next) => {
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

  if (min && compareVersions(clientVersion, min) < 0) {
    throw new ClientIncompatibleError(VERSION_COMPATIBILITY_ERRORS.LOW).withExtraData({
      ...getUpdateInformation(req, min),
      [VERSION_MINIMUM_PROBLEM_KEY]: min,
      [VERSION_MAXIMUM_PROBLEM_KEY]: max,
    });
  }

  if (max && compareVersions(clientVersion, max) > 0) {
    if (semverDiff(max, clientVersion) === 'patch') {
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
