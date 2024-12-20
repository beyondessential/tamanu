const os = require('node:os');
const config = require('config');

const totalMemoryMB = Math.round(os.totalmem() / (1024**2));
const memory = process.env.TAMANU_MEMORY_ALLOCATION || (totalMemoryMB * 0.6).toFixed(0);

const availableThreads = os.availableParallelism();
const minimumApiScale = totalMemoryMB > 3000 ? 2 : 1;
const maximumApiScale = 4; // more requires custom caddy config
const defaultApiScale = Math.min(maximumApiScale, Math.max(minimumApiScale, Math.floor(availableThreads / 2)));

const cwd = '.'; // IMPORTANT: Leave this as-is, for production build

function task(name, args, instances = 1, env = {}) {
  const base = {
    name,
    cwd,
    script: './dist/index.js',
    args,
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

const apps = [
  task('tamanu-api', 'startApi', +process.env.TAMANU_API_SCALE || defaultApiScale, {
    PORT: +process.env.TAMANU_API_PORT || 3000,
  }),
  task('tamanu-tasks', 'startTasks'),
];

if (config?.integrations?.fhir?.worker?.enabled) {
  apps.push(
    task('tamanu-fhir-refresh', 'startFhirWorker --topics=fhir.refresh.allFromUpstream,fhir.refresh.entireResource,fhir.refresh.fromUpstream'),
    task('tamanu-fhir-resolve', 'startFhirWorker --topics=fhir.resolver'),
  );
}

module.exports = { apps };
