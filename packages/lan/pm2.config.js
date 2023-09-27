module.exports = {
  apps: [
    {
      name: 'tamanu-lan-server',
      exec_mode: 'fork',
      instances: 1,
      cwd: '.', // IMPORTANT: Leave this as-is, for production build
      script: './dist/app.bundle.js',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
