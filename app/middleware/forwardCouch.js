const onHeaders = require('on-headers');
const request = require('request');
const config = require('config');
// const proxy = require('http-proxy-middleware');
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

/**
 * Configure proxy middleware
 */
// module.exports = proxy({
//   target: `http://${config.db.user}:${config.db.password}@${config.db.host}:${config.db.port}`,
//   changeOrigin: true, // for vhosted sites, changes host header to match to target's host
//   logLevel: 'debug'
// });

// module.exports = (req, res) => {
//   const host = `http://${config.db.user}:${config.db.password}@${config.db.host}:${config.db.port}`;
//   const useOauth = false;
//   const forwardURL = host + req.url;
//   const requestOptions = {
//     url: forwardURL
//   };

//   let reqMethod = req.method.toLowerCase();
//   if (reqMethod === 'delete') reqMethod = 'del';
//   if (useOauth) {
//     if (req.get('x-oauth-consumer-key')) {
//       requestOptions.oauth = {
//         consumer_key: req.get('x-oauth-consumer-key'),
//         consumer_secret: req.get('x-oauth-consumer-secret'),
//         token: req.get('x-oauth-token'),
//         token_secret: req.get('x-oauth-token-secret')
//       };
//     }
//   }

//   console.log('requestOptions', requestOptions, reqMethod);

//   // if (config.emberCLI) {
//     // Ember CLI uses compression (https://www.npmjs.com/package/compression) which
//     // causes issues when proxying requests, so turn off compression for proxied requests.
//     onHeaders(res, () => {
//       res.header('Cache-Control', 'no-transform');
//     });
//   // }

//   console.log('params', req.params);
//   console.log('body', req.body);

//   const _request = request[reqMethod](requestOptions);
//   _request.on('error', (err) => {
//     console.log('Got error forwarding: ', err);
//   });

//   console.log('_request', _request);

//   req.pipe(_request).pipe(res);
// };


// const couchProxy = require('express-couch-proxy');
// module.exports = couchProxy({ realm: 'CouchDB Replication' }, (database, username, password, next) => {
//   console.log('couchProxy', { database, username, password, next });
//   return next(null, `http://couchadmin:test@localhost:5980/${database}`);
//   // return next(new Error('unauthorized'));
// });
