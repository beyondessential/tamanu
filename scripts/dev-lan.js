const concurrently = require('concurrently');

concurrently([
  "yarn workspace shared-src run build-watch",
  "yarn workspace lan run start-dev",
], {
  // shared-build doesn't have an output, so don't process console output
  raw: true,
});
