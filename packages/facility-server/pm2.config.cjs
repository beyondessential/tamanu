const memory = process.env.TAMANU_MEMORY_ALLOCATION || 8192;

const cwd = '.'; // IMPORTANT: Leave this as-is, for production build

module.exports = {
  apps: [
    {
      name: 'tamanu-api',
      cwd,
      script: './dist/index.js',
      args: 'startAll',
      interpreter_args: `--max_old_space_size=${memory}`,
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
