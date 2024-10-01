const os = require('node:os');

const totalMemoryMB = os.totalmem() / (1024**2);
const memory = process.env.TAMANU_MEMORY_ALLOCATION || (totalMemoryMB * 0.6);

const availableThreads = os.availableParallelism();
const defaultApiScale = Math.max(2, Math.floor(availableThreads / 2));

const cwd = '.'; // IMPORTANT: Leave this as-is, for production build

module.exports = {
  apps: [
    {
      name: 'tamanu-api',
      cwd,
      script: './dist/index.js',
      args: 'startApi',
      interpreter_args: `--max_old_space_size=${memory}`,
      instances: +process.env.TAMANU_API_SCALE || defaultApiScale,
      exec_mode: 'fork',
      increment_var: 'PORT',
      env: {
        PORT: +process.env.TAMANU_API_PORT || 4000,
        NODE_ENV: 'production',
      },
    },
    {
      name: 'tamanu-tasks',
      cwd,
      script: './dist/index.js',
      args: 'startTasks',
      interpreter_args: `--max_old_space_size=${memory}`,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'tamanu-sync',
      cwd,
      script: './dist/index.js',
      args: 'startSync',
      interpreter_args: `--max_old_space_size=${memory}`,
      instances: 1,
      exec_mode: 'fork',
      env: {
        PORT: +process.env.TAMANU_SYNC_PORT || 4000,
        NODE_ENV: 'production',
      },
    },
  ],
};
