const concurrently = require('concurrently');

const [_node, _script, workspace, command] = process.argv;

concurrently(
  ['yarn workspace shared-src run build-watch', `yarn workspace ${workspace} run ${command}`],
  {
    // shared build doesn't have any console output, so this just means the test output
    // comes through un-annotated
    raw: true,
  },
);
