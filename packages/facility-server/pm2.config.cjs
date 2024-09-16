const os = require('node:os');

const totalMemoryMB = Math.round(os.totalmem() / (1024**2));
const memory = process.env.TAMANU_MEMORY_ALLOCATION || (totalMemoryMB * 0.6).toFixed(0);

const availableThreads = os.availableParallelism();
const minimumApiScale = totalMemoryMB > 3000 ? 2 : 1;
const maximumApiScale = 4; // more requires custom caddy config
const defaultApiScale = Math.min(maximumApiScale, Math.max(minimumApiScale, Math.floor(availableThreads / 2)));

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
        PORT: +process.env.TAMANU_SYNC_PORT || 5000,
        NODE_ENV: 'production',
      },
    },
  ],
};
