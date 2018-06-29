module.exports = {
  app: {
    port: 3000,
  },
  proxy: {
    port: 3500,
  },
  crypto: {
    pbkdf2: {
      iterations: 100000,
      keylen: 64,
      digest: 'sha512',
    },
  },
  db: {
    host: 'localhost',
    user: 'couchadmin',
    password: 'test',
    port: 5980,
  },
};
