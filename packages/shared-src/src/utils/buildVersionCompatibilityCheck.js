import compareVersions from 'semver-compare';
import semverDiff from 'semver-diff';
import config from 'config';
import { VERSION_COMPATIBILITY_ERRORS } from '../constants';

const respondWithError = (res, error) => {
  res.status(400).json({ error });
};

export const buildVersionCompatibilityCheck = supportedClientVersions => (req, res, next) => {
  const clientType = req.header('X-Tamanu-Client') || req.header('X-Runtime');

  if (!clientType && config.auth.allowEmptyTamanuClient) {
    // a thirdparty tool (or internal test suite) is using the API; ignore version checking
    next();
    return;
  }

  const clientTypes = Object.keys(supportedClientVersions);
  if (!clientTypes.includes(clientType)) {
    const allowedClientTypes = clientTypes.map(v => `"${v}"`).join(', ');
    res.status(400).json({
      error: {
        message: `The only supported X-Tamanu-Client values are [${allowedClientTypes}]`,
        name: 'InvalidClientType',
      },
    });
    return;
  }

  const clientInfo = supportedClientVersions[clientType];
  const { min, max } = clientInfo;

  // include the min/max supported clients with any response
  res.setHeader('X-Min-Client-Version', min);
  res.setHeader('X-Max-Client-Version', max);

  // check the connecting client is supported, and respond with an error if not
  const clientVersion = req.header('X-Version');
  if (min && compareVersions(clientVersion, min) < 0) {
    respondWithError(res, {
      message: VERSION_COMPATIBILITY_ERRORS.LOW,
      name: 'InvalidClientVersion',
    });
    return;
  }
  if (max && compareVersions(clientVersion, max) > 0) {
    if (semverDiff(max, clientVersion) === 'patch') {
      console.error(
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
