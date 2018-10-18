const { buildCheckFunction, validationResult } = require('express-validator/check');
const { chain } = require('lodash');
const AuthService = require('../../services/auth');

const internals = {
  checkBody: buildCheckFunction(['body'])
};

internals.validateBody = [
  internals.checkBody('clientId').exists().withMessage('clientId is required'),
  internals.checkBody('email').isEmail().exists().withMessage('email is required'),
  internals.checkBody('password').exists().withMessage('password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        errors: chain(errors.array()).map('msg').uniq().value(),
      });
    }
    return next();
  },
];

internals.login = async (req, res) => {
  const database = req.app.get('realm');
  const { email, password, clientId } = req.body;
  const authService = new AuthService(database);
  const doLogin = await authService.login({ email, password, clientId });
  if (doLogin !== false) {
    return res.json({
      userId: doLogin.userId,
      clientId: doLogin.clientId,
      clientSecret: doLogin.clientSecret,
    });
  }

  return res.json({
    error: 'Invalid email or password entered.'
  });
};

module.exports = [
  internals.validateBody,
  internals.login
];
