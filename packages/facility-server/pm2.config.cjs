const memory = process.env.TAMANU_MEMORY_ALLOCATION || 8192;

module.exports = {
  apps: [
    {
      name: 'tamanu-api-server',
      cwd: '.', // IMPORTANT: Leave this as-is, for production build
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
