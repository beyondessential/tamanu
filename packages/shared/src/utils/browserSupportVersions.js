import browserslist from 'browserslist';

const majorFrom = (query) =>
  Math.max(...browserslist(query).map((entry) => parseInt(entry.split(' ')[1], 10)));

let cached;

// Latest stable major version per engine, from browserslist's bundled
// caniuse-lite data. Used by the public browser-support endpoint to floor the
// "N versions back" check. Resolved once per process — the data is static for a
// given deploy. Freshness tracks the installed caniuse-lite, the same way the
// web build's MIN_CHROME_VERSION does (see packages/web/vite.config.js); stale
// data only ever lowers the floor, it never wrongly blocks a current browser.
//
// Server-only: this imports browserslist (Node) and must never be pulled into
// the web bundle.
export const getCurrentBrowserMajors = () => {
  if (!cached) {
    cached = {
      chromium: majorFrom('last 1 chrome version'),
      firefox: majorFrom('last 1 firefox version'),
      // Safari majors can be decimal (e.g. "safari 18.2"); parseInt → 18.
      safari: majorFrom('last 1 safari version'),
    };
  }
  return cached;
};
