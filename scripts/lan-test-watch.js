const concurrently = require('concurrently');

concurrently([
  "yarn workspace shared-src run build-watch",
  "yarn workspace lan run test-watch",
], {
  // shared build doesn't have any console output, so this just means the test output
  // comes through un-annotated
  raw: true,
});
