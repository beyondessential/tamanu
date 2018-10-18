const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const bodyParser = require('body-parser');
const express = require('express');
const expressSession = require('express-session');
const passport = require('passport');
const serializer = require('serializer');
const request = require('request');

function createSecret(secretBase) {
  const encryptKey = serializer.randomString(48);
  const validateKey = serializer.randomString(48);
  const secretString = serializer.secureStringify(secretBase, encryptKey, validateKey);
  if (secretString.length > 80) {
    secretString = secretString.substr(30,50);
  }
  return secretString;
}

function denormalizeOAuth(user) {
  let key = null;
  for (key in user.oauth.consumer_keys) {
    user.consumer_key = key;
    user.consumer_secret = user.oauth.consumer_keys[key];
    break;
  }
  for (key in user.oauth.tokens) {
    user.token_key = key;
    user.token_secret = user.oauth.tokens[key];
    break;
  }
  return user;
}

function validateOAuth(oauth) {
  try {
    if (Object.keys(oauth.consumer_keys).length > 0 && Object.keys(oauth.tokens).length > 0) {
      return true;
    }
  } catch (ex) {
    // Oauth is bad, just let the false return;
  }
  return false;
}



function getPrimaryRole(user) {
  const primaryRole = '';
  if (user.roles) {
    user.roles.forEach(function(role) {
      if (role !== 'user' && role !== 'admin') {
        primaryRole = role;
      }
    });
  }
  return primaryRole;
}


// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Google profile is
//   serialized and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

module.exports = (app, config) => {
  // *eslint new-cap: ["error", { "capIsNewExceptions": ["Router"] }]*/
  const router = express.Router();
  const nano = require('nano')(config.couchAuthDbURL);
  const users = nano.use('_users');
  router.use(bodyParser.json());
  router.use(bodyParser.urlencoded({
    extended: true
  }));
  router.use(expressSession({secret: 'health matters', resave: true, saveUninitialized: false}));


  function createOAuthTokens(secretBase, user, callback) {
    const consumerKey = serializer.randomString(96);
    const tokenKey = serializer.randomString(96);
    user.oauth = {
      consumer_keys: {},
      tokens: {},
    };
    user.oauth.consumer_keys[consumerKey] = createSecret(secretBase);
    user.oauth.tokens[tokenKey] = createSecret(secretBase);
    users.insert(user, user._id, function(err, response) {
      if (err || !response.ok) {
        callback(response);
      } else {
        callback(null, denormalizeOAuth(user));
      }
    });
  }

  function findOAuthUser(accessToken, refreshToken, profile, callback) {
    const userKey = 'org.couchdb.user:' + profile.emails[0].value;
    users.get(userKey, {}, function(err, body) {
      if (err) {
        if (err.error && err.error === 'not_found') {
          callback(null, false);
        } else {
          callback(err);
        }
        return;
      }
      if (body.deleted) {
        callback(null, false);
        return;
      }
      if (validateOAuth(body.oauth)) {
        callback(null, denormalizeOAuth(body));
      } else {
        createOAuthTokens(accessToken, body, callback);
      }
    });
  }

  function findUser(userName, callback) {
    const userKey = userName;
    if (userKey.indexOf('org.couchdb.user:') !== 0) {
      userKey = 'org.couchdb.user:' + userKey;
    }
    users.get(userKey, {}, function(err, body) {
      if (err) {
        callback(err);
        return;
      }
      if (body && body.deleted) {
        callback(true);
        return;
      }
      if (validateOAuth(body.oauth)) {
        callback(null, denormalizeOAuth(body));
      } else {
        createOAuthTokens(serializer.randomString(48), body, callback);
      }
    });
  }

  function getSession(req, res, requestOptions, includeOauth) {
    requestOptions.url = config.couchDbURL +'/_session';
    request(requestOptions, function (error, response, body) {
      if (error) {
        res.json({error: true, errorResult: error});
      } else {
        const userSession = JSON.parse(body);
        const userDetails = userSession.userCtx || userSession;
        if (userDetails.name === req.body.name) {
          // User names match; we should respond with requested info
          findUser(userDetails.name, function(err, user) {
            if (err) {
              res.json({error: true, errorResult: err});
            } else {
              const response = {
                displayName: user.displayName,
                prefix: user.userPrefix,
                role: getPrimaryRole(user)
              };
              if (includeOauth) {
                response.k =  user.consumer_key;
                response.s1 = user.consumer_secret;
                response.t = user.token_key;
                response.s2 = user.token_secret;
              }
              res.json(response);
            }
          });
        } else {
          // User names don't match, throw error!
          res.json({error: true, errorResult: 'You are not authorized'});
        }
      }
    });
  }

  router.post('/login', (req, res) => {
    const requestOptions = {
      method: 'POST',
      form: req.body
    };
    getSession(req, res, requestOptions, true);
  });

  router.post('/chk-user', (req, res) => {
    const requestOptions = {};
    if (req.get('x-oauth-consumer-key')) {
      requestOptions.oauth = {
        consumer_key: req.get('x-oauth-consumer-key'),
        consumer_secret: req.get('x-oauth-consumer-secret'),
        token: req.get('x-oauth-token'),
        token_secret: req.get('x-oauth-token-secret')
      };
    }
    getSession(req, res, requestOptions, false);
  });

  router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });
  
  app.use('/', router);
};
