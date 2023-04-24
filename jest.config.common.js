const isCI = !!process.env.CI;

module.exports = {
  transform: {
    '^.+\\.js$': '@swc/jest',
  },
  testEnvironment: 'node',
  maxWorkers: isCI ? '100%' : '50%',

  // workaround for memory leaks
  workerIdleMemoryLimit: '512MB',
};
