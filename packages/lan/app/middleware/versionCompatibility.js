import compareVersions from 'semver-compare';
import { VERSION_COMPATIBILITY_ERRORS } from 'shared/constants';

// If a new version of the desktop app is being released in conjunction with an update to the LAN
// server, set MIN_CLIENT_VERSION to reflect that, and desktop users will be logged out until they
// have updated.
export const MIN_CLIENT_VERSION = '1.0.0';
const MAX_CLIENT_VERSION = '1.0.0';

export const versionCompatibility = (req, res, next) => {
  // include the min/max supported clients with any response
  res.setHeader('X-Min-Client-Version', MIN_CLIENT_VERSION);
  res.setHeader('X-Max-Client-Version', MAX_CLIENT_VERSION);

  // check the connecting client is supported, and respond with an error if not
  const clientVersion = req.header('X-Client-Version');
  if(!clientVersion) {
    // a thirdparty tool (or internal test suite) is using the API; ignore version checking
    next();
    return;
  }

  if (compareVersions(clientVersion, MIN_CLIENT_VERSION) < 0) {
    res
      .status(400)
      .json({ error: { message: VERSION_COMPATIBILITY_ERRORS.LOW, name: 'InvalidClientVersion' } });
    return;
  }
  if (compareVersions(clientVersion, MAX_CLIENT_VERSION) > 0) {
    res.status(400).json({
      error: { message: VERSION_COMPATIBILITY_ERRORS.HIGH, name: 'InvalidClientVersion' },
    });
    return;
  }
  next();
};
