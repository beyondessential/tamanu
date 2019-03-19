const { buildCheckFunction, validationResult } = require('express-validator/check');
const { chain } = require('lodash');
const AuthService = require('../../services/auth');

const internals = {
  checkBody: buildCheckFunction(['body']),
};

internals.validateBody = [
  internals.checkBody('clientId').exists().withMessage('clientId is required'),
  internals.checkBody('email').isEmail().exists().withMessage('email is required'),
  internals.checkBody('password').exists().withMessage('password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        error: chain(errors.array()).map('msg').uniq().value(),
      });
    }
    return next();
  },
];

internals.login = async (req, res) => {
  const database = req.app.get('realm');
  const {
    email, password, hospital, clientId, firstTimeLogin,
  } = req.body;

  try {
    const authService = new AuthService(database);
    const doLogin = await authService.login({
      email,
      password,
      hospital,
      clientId,
      firstTimeLogin,
    });
    if (doLogin !== false) {
      return res.json(doLogin);
    }
    throw doLogin;
  } catch (err) {
    return res.status(404).send(err.toString());
  }
};

module.exports = [
  internals.validateBody,
  internals.login,
];
