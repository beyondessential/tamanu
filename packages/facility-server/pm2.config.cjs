module.exports = {
  apps: [
    {
      name: 'tamanu-http-server',
      exec_mode: 'fork',
      instances: 1,
      cwd: '.', // IMPORTANT: Leave this as-is, for production build
      script: './dist/index.js',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
