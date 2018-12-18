const config = require('configs');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({});

module.exports = (req, res) => {
  proxy.on('error', (e) => {
    console.log('proxy - error', e);
  });

  proxy.web(req, res, {
    target: `http://${config.localDB.username}:${config.localDB.password}@${config.localDB.host}:${config.localDB.port}`
  });
};
