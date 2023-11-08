const memory = process.env.TAMANU_MEMORY_ALLOCATION || 8192;

module.exports = {
  apps: [
    {
      name: 'tamanu-sync-server',
      cwd: '.', // IMPORTANT: Leave this as-is, for production build
      script: './dist/index.js',
      args: 'serve',
      interpreter_args: `--max_old_space_size=${memory}`,
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'tamanu-tasks-runner',
      cwd: '.', // IMPORTANT: Leave this as-is, for production build
      script: './dist/index.js',
      args: 'tasks',
      interpreter_args: `--max_old_space_size=${memory}`,
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
