const { fileURLToPath } = require('node:url');

// jest resolves filesystem paths, but ESM specifiers may legitimately be file:// URLs — code
// that dynamically imports an absolute path has to pass one, because on Windows a bare `C:\…`
// is read as a URL with scheme `c:` (see the migration resolver in @tamanu/database). Under
// jest those modules are transpiled to CommonJS, so the import becomes a require and lands
// here; hand the default resolver the path it expects.
module.exports = (request, options) =>
  options.defaultResolver(
    request.startsWith('file://') ? fileURLToPath(request) : request,
    options,
  );
