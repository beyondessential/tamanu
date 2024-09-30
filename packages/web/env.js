(()=>{
  const readEnv = (name) => {
    if (typeof this[name] !== 'undefined') {
      return this[name];
    }

    if (typeof process !== 'undefined' && typeof process.env !== 'undefined' && typeof process.env[name] !== 'undefined') {
      return process.env[name];
    }

    return localStorage.getItem(name);
  };

  // make sure to update Caddyfile.docker when changing this
  window.env = {
    NODE_ENV: readEnv('NODE_ENV'),
    BUGSNAG_API_KEY: readEnv('BUGSNAG_API_KEY'),
  };
})();

