// In the container image, this file is completely ignored and instead served
// directly from the HTTP server, with the contents of select environment
// variables. In the development server, environment variables are set via the
// vite environment. But in non-container production, this is how you can set
// environment variables into the webapp. From code, use the exports from
// utils/env.js instead of window.env directly.
window.env = {
  // NODE_ENV: 'production',
  // BUGSNAG_API_KEY: '',
};

