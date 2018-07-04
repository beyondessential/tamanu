const config = require('config');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({});

module.exports = (req, res) => {
  proxy.on('error', (e) => {
    console.log('proxy - error', e);
  });

  proxy.web(req, res, {
    target: `http://${config.db.user}:${config.db.password}@${config.db.host}:${config.db.port}`
  });
};
