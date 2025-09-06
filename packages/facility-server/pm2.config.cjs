const os = require('node:os');

const totalMemoryMB = Math.round(os.totalmem() / (1024**2));
const memory = process.env.TAMANU_MEMORY_ALLOCATION || (totalMemoryMB * 0.6).toFixed(0);
const lowMemory = totalMemoryMB < 2500;

const availableThreads = os.availableParallelism();
const minimumApiScale = 2;
const maximumApiScale = 4; // more requires custom caddy config
const defaultApiScale = Math.min(maximumApiScale, Math.max(minimumApiScale, Math.floor(availableThreads / 2)));

const cwd = '.'; // IMPORTANT: Leave this as-is, for production build

function task(name, args, instances = 1, env = {}) {
  const base = {
    name,
    cwd,
    script: './dist/index.js',
    args,
    interpreter: require.resolve('node/bin/node'),
    interpreter_args: `--max_old_space_size=${memory}`,
    instances,
    exec_mode: 'fork',
    restart_delay: 5000,
    env: {
      NODE_ENV: 'production',
      ...env,
    },
  };

  if (env?.PORT) {
    base.increment_var = 'PORT';
  }

  return base;
}

module.exports ={
  apps: lowMemory ? [
    task('tamanu-all', 'startAll', 1, {
      PORT: +process.env.TAMANU_API_PORT || 4000,
    }),
  ] : [
    task('tamanu-api', 'startApi', +process.env.TAMANU_API_SCALE || defaultApiScale, {
      PORT: +process.env.TAMANU_API_PORT || 4000,
    }),
    task('tamanu-tasks', 'startTasks'),
    task('tamanu-sync', 'startSync'),
  ],
};
