const concurrently = require('concurrently');

const [workspace, command] = process.argv.slice(2);

concurrently(
  ['yarn workspace @tamanu/shared run build-watch', `yarn workspace ${workspace} run ${command}`],
  {
    // shared build doesn't have any console output, so this just means the test output
    // comes through un-annotated
    raw: true,
  },
);
