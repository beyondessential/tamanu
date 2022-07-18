import compareVersions from 'semver-compare';
import semverDiff from 'semver-diff';
import config from 'config';
import { VERSION_COMPATIBILITY_ERRORS } from '../constants';
import { log } from '../services/logging';

const respondWithError = (res, error) => {
  res.status(400).json({ error });
};

function getUpdateInformation(req) {
  if (!config.updateUrls) return {};

  const clientType = req.header('X-Tamanu-Client') || '';
  if (clientType.includes('Tamanu Mobile')) {
    return {
      updateUrl: config.updateUrls.mobile,
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
    respondWithError(res, {
      message: VERSION_COMPATIBILITY_ERRORS.LOW,
      name: 'InvalidClientVersion',
      ...getUpdateInformation(req),
    });
    return;
  }
  if (max && compareVersions(clientVersion, max) > 0) {
    if (semverDiff(max, clientVersion) === 'patch') {
      log.error(
        `Allowing client v${clientVersion} with higher patch than max supported v${max} to connect`,
      );
      next();
      return;
    }
    respondWithError(res, {
      message: VERSION_COMPATIBILITY_ERRORS.HIGH,
      name: 'InvalidClientVersion',
    });
    return;
  }
  next();
};
