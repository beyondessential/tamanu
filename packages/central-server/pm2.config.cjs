const os = require('node:os');

const totalMemoryMB = os.totalmem() / (1024**2);
const memory = process.env.TAMANU_MEMORY_ALLOCATION || (totalMemoryMB * 0.6);

const availableThreads = os.availableParallelism();
const defaultApiScale = Math.max(2, Math.floor(availableThreads / 2));

module.exports = {
  apps: [
    {
      name: 'tamanu-api-server',
      cwd: '.', // IMPORTANT: Leave this as-is, for production build
      script: './dist/index.js',
      args: 'startServe',
      interpreter_args: `--max_old_space_size=${memory}`,
      instances: +process.env.TAMANU_API_SCALE || defaultApiScale,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'tamanu-tasks-runner',
      cwd: '.', // IMPORTANT: Leave this as-is, for production build
      script: './dist/index.js',
      args: 'startTasks',
      interpreter_args: `--max_old_space_size=${memory}`,
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'tamanu-fhir-worker',
      cwd: '.', // IMPORTANT: Leave this as-is, for production build
      script: './dist/index.js',
      args: 'startFhirWorker',
      interpreter_args: `--max_old_space_size=${memory}`,
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
